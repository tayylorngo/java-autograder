// Java autograder: zero dependencies (Node 18+ and a JDK on the PATH).
const http = require("http"), fs = require("fs"), path = require("path"), os = require("os");
const { spawn } = require("child_process");
const crypto = require("crypto");
const PROGRAMS = JSON.parse(fs.readFileSync(path.join(__dirname, "tests.json"), "utf8"));
const PORT = process.env.PORT || 8080;
const TEACHER_KEY = process.env.TEACHER_KEY || "";          // set this to use /teacher.html and /api/results?key=...
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";   // set to your Netlify URL if the page is hosted there
const LOG = process.env.LOG_FILE || path.join(__dirname, "submissions.jsonl");
const RUN_MS = +process.env.RUN_MS || 3000;                 // per-test time limit (raise only on a very slow host)
const COMPILE_MS = 20000, MAX_CODE = 30000, MAX_OUT = 20000, MAX_PARALLEL = +process.env.MAX_PARALLEL || 2;
const STATE_FILE = process.env.STATE_FILE || path.join(path.dirname(LOG), "state.json");
const POLICY = path.join(__dirname, "grader.policy");       // Java security-manager policy: grants student code nothing
// ---- scoring (edit here; the README documents it) ----
const SCORING = {
  accuracy: 100,            // points for a program = accuracy * (best tests passed / total)
  perFailedAttempt: 5,      // minus this for every compiled upload after the first on that program...
  maxPenalty: 30,           // ...capped here
  speedBonus: 50,           // full solve at minute 0 earns this, shrinking linearly to 0 at roundMinutes
  roundMinutes: +process.env.ROUND_MINUTES || 40
};
const cellPoints = (c) => {
  const acc = Math.round(SCORING.accuracy * c.best / c.total);
  const pen = Math.min(SCORING.maxPenalty, SCORING.perFailedAttempt * Math.max(0, c.attempts - 1));
  const bonus = c.solvedAt === null ? 0 : Math.round(SCORING.speedBonus * Math.max(0, 1 - c.solvedAt / (SCORING.roundMinutes * 60000)));
  return Math.max(0, acc - pen) + bonus;
};
// state: "waiting" (lobby; teams can form) | "open" (uploads allowed, teams locked) | "closed" (paused/finished)
// players: { id: { name, team, ready, lastSeen } }   teams: { id: { members: [playerId], cells: { progId: { attempts, best, total, solvedAt, points } } } }
const fresh = () => ({ state: "waiting", startedAt: null, players: {}, teams: {} });
let S = fresh();
try { const j = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); if (j && j.players && j.teams) S = { ...fresh(), ...j }; } catch (e) {}
const save = () => { try { fs.writeFileSync(STATE_FILE, JSON.stringify(S)); } catch (e) {} };
const newId = () => crypto.randomUUID();
const cleanName = (n) => String(n || "").replace(/\s+/g, " ").trim().slice(0, 40);
const nameKey = (n) => cleanName(n).toLowerCase();
const ONLINE_MS = 15000;
const teamName = (t) => t.members.map(p => (S.players[p] || { name: "?" }).name).join(" & ");
const teamMembers = (t) => t.members.map(p => { const pl = S.players[p]; return { name: pl.name, ready: !!pl.ready, online: Date.now() - pl.lastSeen < ONLINE_MS }; });
function leaveTeam(pid) {
  const pl = S.players[pid], t = S.teams[pl.team];
  if (t) { t.members = t.members.filter(x => x !== pid); if (!t.members.length) delete S.teams[pl.team]; }
  pl.team = null;
}
function soloTeam(pid) { const id = newId(); S.teams[id] = { members: [pid], cells: {} }; S.players[pid].team = id; return id; }
function record(team, prog, out) {
  if (!out.total) return null;                                      // not compiled: no attempt counted
  const c = team.cells[prog.id] || (team.cells[prog.id] = { attempts: 0, best: 0, total: out.total, solvedAt: null, points: 0 });
  c.attempts++;
  if (out.passed > c.best) c.best = out.passed;
  if (out.passed === out.total && c.solvedAt === null) c.solvedAt = Date.now() - (S.startedAt || Date.now());
  c.points = cellPoints(c);
  save();
  return c;
}
const teamTotals = (t) => {
  const cells = Object.values(t.cells);
  return { points: cells.reduce((a, c) => a + c.points, 0), solved: cells.filter(c => c.solvedAt !== null).length, tests: cells.reduce((a, c) => a + c.best, 0),
    last: cells.reduce((a, c) => c.solvedAt !== null ? Math.max(a, c.solvedAt) : a, 0) };
};
const rankTeams = () => Object.entries(S.teams).filter(([, t]) => t.members.length).map(([id, t]) => ({ id, name: teamName(t), members: teamMembers(t), cells: t.cells, ...teamTotals(t) }))
  .sort((a, b) => b.points - a.points || b.solved - a.solved || b.tests - a.tests || a.last - b.last || a.name.localeCompare(b.name));
function lobby() {
  const teams = Object.entries(S.teams).filter(([, t]) => t.members.length).map(([id, t]) => { const m = teamMembers(t); return { id, name: teamName(t), members: m, ready: m.every(x => x.ready), full: m.length >= 2 }; });
  return { teams, readyTeams: teams.filter(t => t.ready).length, totalTeams: teams.length, players: Object.keys(S.players).length };
}
function board() {
  return { state: S.state, startedAt: S.startedAt, now: Date.now(), scoring: SCORING, lobby: lobby(),
    programs: PROGRAMS.map(p => ({ id: p.id, title: p.title.replace(/^Program \d+ — /, ""), n: p.title.match(/\d+/)[0] })), rows: rankTeams() };
}
function me(pid) {
  const pl = S.players[pid]; if (!pl) return null;
  pl.lastSeen = Date.now();
  if (!pl.team || !S.teams[pl.team]) soloTeam(pid);
  const t = S.teams[pl.team], rows = rankTeams(), rank = rows.findIndex(r => r.id === pl.team) + 1;
  return { state: S.state, startedAt: S.startedAt, now: Date.now(), scoring: SCORING, me: { id: pid, name: pl.name, ready: !!pl.ready },
    team: { id: pl.team, name: teamName(t), members: teamMembers(t), cells: t.cells, ...teamTotals(t), rank, of: rows.length }, lobby: lobby() };
}
// Student processes get a minimal environment: never TEACHER_KEY or anything else from the host.
const childEnv = {};
for (const k of ["PATH", "HOME", "JAVA_HOME", "TMPDIR", "LANG", "LC_ALL"]) if (process.env[k]) childEnv[k] = process.env[k];
if (!childEnv.LANG) childEnv.LANG = "C.UTF-8";

// ---- source checks: students only need java.util.Scanner ----
// javac turns Runtime into Runtime *before* it reads the code, so decode escapes the same way first
// (a backslash preceded by an odd number of backslashes is not an escape).
const decodeU = (s) => s.replace(/(^|[^\\])((?:\\\\)*)\\u+([0-9a-fA-F]{4})/g, (_, a, b, h) => a + b + String.fromCharCode(parseInt(h, 16)));
// Drop comments and the insides of string/char literals: a comment like "// process each item" must not
// trip the filter, and a string must not hide a class name. Everything that can run stays.
function stripLiterals(s) {
  let o = "", i = 0; const n = s.length;
  while (i < n) {
    const c = s[i], c2 = s[i + 1];
    if (c === "/" && c2 === "/") { while (i < n && s[i] !== "\n") i++; }
    else if (c === "/" && c2 === "*") { const e = s.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; o += " "; }
    else if (c === '"' && c2 === '"' && s[i + 2] === '"') { const e = s.indexOf('"""', i + 3); i = e < 0 ? n : e + 3; o += '""'; }
    else if (c === '"' || c === "'") { let j = i + 1; while (j < n && s[j] !== c && s[j] !== "\n") { if (s[j] === "\\") j++; j++; } o += c + c; i = j + 1; }
    else { o += c; i++; }
  }
  return o;
}
const BANNED = new RegExp([
  // packages (also fully qualified, so `new java.io.File(..)` without an import is caught)
  "java\\s*\\.\\s*(io|net|nio|sql|rmi|security|awt|beans|applet|lang\\s*\\.\\s*(reflect|invoke|instrument|management|module|ref)|util\\s*\\.\\s*(concurrent|logging|prefs|jar|zip|spi))",
  "\\bjavax\\b", "\\bjdk\\s*\\.", "\\bsun\\s*\\.", "\\bcom\\s*\\.\\s*sun\\b", "\\bimport\\s+static\\b",
  // processes, threads, class loading
  "\\bRuntime\\b", "ProcessBuilder", "ProcessHandle", "\\bProcess\\b", "\\bThread\\b", "ThreadGroup", "ClassLoader", "Unsafe", "MethodHandle", "ServiceLoader", "\\bCleaner\\b",
  "Executor", "CompletableFuture", "ForkJoin", "parallelStream", "\\bparallel\\s*\\(", "\\bTimer\\b",
  // reflection (Class.forName("java.lang.Run"+"time").getMethod(..).invoke(..) needs none of the words above)
  "Class\\s*\\.\\s*forName", "\\.\\s*(getClass|getMethods?|getDeclared\\w*|getConstructors?|newInstance|invoke|getResource\\w*|getFields?|getModule|getProtectionDomain|getClassLoader)\\s*\\(",
  "System\\s*\\.\\s*(exit|setIn|setOut|setErr|getenv|getProperty|getProperties|setProperty|setProperties|clearProperty|load\\w*|setSecurityManager|getSecurityManager|console|inheritedChannel|runFinalization|getLogger|mapLibraryName)"
].join("|"));
const BAD_IMPORT = /\bimport\s+(?!java\.util\.(Scanner|\*)\s*;)[^;]*;/;   // anywhere, not only at a line start
const norm = (s) => s.replace(/\r\n/g, "\n").split("\n").map(l => l.replace(/[ \t]+$/, "")).join("\n").replace(/\s+$/, "");
const squash = (s) => s.replace(/\s+/g, " ").replace(/\s*([(),])\s*/g, "$1");

// ---- running javac / java ----
// Student JVMs run under the Java security manager with an empty policy (no files, network, exec, env or
// private reflection) and, where the OS allows it, a cap on how many processes/threads they can create.
let SANDBOX = ["-Djava.security.manager", "-Djava.security.policy==" + POLICY];
let ULIMIT = true;
const javacArgs = (file) => ["-J-Xmx160m", "-J-XX:TieredStopAtLevel=1", "-J-XX:+UseSerialGC", "-J-XX:-UsePerfData", "-encoding", "UTF-8", "-proc:none", "-Xmaxerrs", "20", "-d", ".", file];
const javaArgs = (dir, cls) => ["-Xmx64m", "-Xss512k", "-XX:MaxMetaspaceSize=48m", "-XX:ReservedCodeCacheSize=16m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-XX:CICompilerCount=1", "-XX:-UsePerfData",
  "-Dfile.encoding=UTF-8", "-Dsun.stdout.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-Djava.awt.headless=true", ...SANDBOX, "-cp", dir, cls];
const JVM_NOISE = /^WARNING: (A command line option has enabled|The Security Manager is deprecated)/;

function run(cmd, args, { cwd, input, timeout, limit }) {
  if (limit && ULIMIT) { args = ["-c", 'ulimit -u 1024 2>/dev/null || ulimit -p 1024 2>/dev/null; exec "$0" "$@"', cmd, ...args]; cmd = "/bin/sh"; }
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, env: childEnv, detached: true, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", killed = false, done = false, flood = false;
    const kill = () => { killed = true; try { process.kill(-p.pid, "SIGKILL"); } catch (e) {} try { p.kill("SIGKILL"); } catch (e) {} };
    const timer = setTimeout(kill, timeout);
    p.stdout.setEncoding("utf8"); p.stderr.setEncoding("utf8");
    p.stdout.on("data", d => { if (out.length < MAX_OUT) out += d; else { flood = true; kill(); } });
    p.stderr.on("data", d => { if (err.length < MAX_OUT) err += d; });
    p.stdin.on("error", () => {});
    p.stdin.end(input || "");
    const fin = (code) => { if (done) return; done = true; clearTimeout(timer); resolve({ out, err, code, timedOut: killed && !flood, flooded: flood }); };
    p.on("close", fin); p.on("error", () => fin(-1));
  });
}

let active = 0; const waiting = [];
const slot = () => new Promise(r => { const go = () => { active++; r(); }; active < MAX_PARALLEL ? go() : waiting.push(go); });
const release = () => { active--; const n = waiting.shift(); if (n) n(); };

async function grade(prog, code) {
  const checks = [];
  code = code.replace(/^﻿/, "");                                   // byte-order mark from Windows editors
  const pk = /^[ \t]*package\s+[\w.]+\s*;[ \t]*/m;                       // IDE projects often add one
  if (pk.test(code)) { code = code.replace(pk, ""); checks.push({ ok: true, msg: "Ignored the package line (not needed for this activity)." }); }
  if (!/^\s*(\/\/|\/\*)/.test(code)) checks.push({ ok: false, soft: true, msg: "File should start with a comment header (names and date)." });
  const sig = squash(prog.header);
  const headerOk = squash(code).includes(sig);
  checks.push({ ok: headerOk, msg: headerOk ? "Method header matches." : "Required method header not found exactly as given: " + prog.header });
  const clsOk = new RegExp("\\bpublic\\s+class\\s+" + prog.cls + "\\b").test(code);
  if (!clsOk) return { error: "The class must be declared as: public class " + prog.cls, checks };
  const src = stripLiterals(decodeU(code));
  const bad = BANNED.exec(src) || BAD_IMPORT.exec(src);
  if (bad) return { error: "This program may only use java.util.Scanner (no file, network, thread, reflection, or system calls). Not allowed: " + bad[0].replace(/\s+/g, " ").slice(0, 60), checks };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grade-"));
  try {
    fs.writeFileSync(path.join(dir, prog.cls + ".java"), code);
    const c = await run("javac", javacArgs(prog.cls + ".java"), { cwd: dir, timeout: COMPILE_MS });
    if (c.code !== 0) return { error: "Compile error", detail: (c.err || c.out || (c.timedOut ? "javac took too long" : "")).split(dir + "/").join("").slice(0, 3000), checks };
    const results = [];
    let slow = 0;
    for (const t of prog.tests) {
      if (slow >= 2) { const res = { name: t.name, hidden: t.hidden, pass: false, note: "Skipped — your program was too slow on earlier tests." }; if (!t.hidden) { res.input = t.input; res.expected = t.expected; res.actual = ""; } results.push(res); continue; }
      const r = await run("java", javaArgs(dir, prog.cls), { cwd: dir, input: t.input.join("\n") + "\n", timeout: RUN_MS, limit: true });
      const pass = !r.timedOut && r.code === 0 && norm(r.out) === norm(t.expected);
      const res = { name: t.name, hidden: t.hidden, pass };
      if (r.timedOut) slow++;
      const errLines = r.err.split("\n").filter(l => l.trim() && !JVM_NOISE.test(l));
      if (r.flooded) res.note = "Your program printed far too much output (infinite loop?)";
      else if (r.timedOut) res.note = "Took too long (infinite loop, or waiting for more input than the prompt asks for?)";
      else if (r.code !== 0) res.note = "Program crashed" + (t.hidden ? "." : ": " + errLines.slice(0, 2).join(" ").slice(0, 300));
      if (!t.hidden) { res.input = t.input; res.expected = t.expected; res.actual = r.out; }
      results.push(res);
    }
    return { checks, results, passed: results.filter(r => r.pass).length, total: results.length };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// Startup self-test: compile and run a tiny Scanner program with the full sandbox. If the host can't use the
// process limit or the security manager (e.g. a JDK that removed it), fall back one layer and say so loudly.
async function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "selftest-"));
  try {
    fs.writeFileSync(path.join(dir, "T.java"), 'import java.util.Scanner;\npublic class T { public static void main(String[] a) { Scanner in = new Scanner(System.in); System.out.print("Name: "); String n = in.next(); int i = in.nextInt(); boolean b = in.nextBoolean(); double d = in.nextDouble(); System.out.println(n + " " + i + " " + b + " " + String.format("%.1f", d)); } }\n');
    const c = await run("javac", javacArgs("T.java"), { cwd: dir, timeout: 60000 });
    if (c.code !== 0) { console.error("SELF-TEST FAILED: javac did not work:\n" + (c.err || c.out)); return; }
    const want = "Name: Kostia 3 true 2.5";
    for (const [u, s] of [[true, true], [false, true], [true, false], [false, false]]) {
      ULIMIT = u; if (!s) SANDBOX = [];
      const t0 = Date.now();
      const r = await run("java", javaArgs(dir, "T"), { cwd: dir, input: "Kostia 3 true 2.5\n", timeout: 30000, limit: true });
      if (r.code === 0 && norm(r.out) === want) {
        console.log(`SELF-TEST OK: one test run took ${Date.now() - t0} ms; security manager ${s ? "ON" : "OFF"}; process limit ${u ? "ON" : "OFF"}`);
        if (!s) console.error("WARNING: student code is NOT running under the Java security manager. Use a JDK 17-21 image.");
        return;
      }
      console.error(`self-test attempt (security manager ${s ? "on" : "off"}, process limit ${u ? "on" : "off"}) failed: code ${r.code} ${r.err.split("\n").filter(l => !JVM_NOISE.test(l)).slice(0, 3).join(" | ")}`);
    }
    console.error("SELF-TEST FAILED: java could not run a Scanner program at all. Grading will not work.");
  } catch (e) { console.error("SELF-TEST ERROR", e); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// ---- tiny rate limits ----
const hits = new Map();
const limited = (ip) => { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 300000); a.push(now); hits.set(ip, a); return a.length > 300; };
const fails = new Map();   // wrong teacher passwords per IP
const tooManyFails = (ip) => { const now = Date.now(), a = (fails.get(ip) || []).filter(t => now - t < 600000); fails.set(ip, a); return a.length >= 20; };
const clientIp = (req) => (String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress || "?";

const send = (res, code, body, type = "application/json") => {
  if (res.writableEnded) return;
  res.writeHead(code, { "Content-Type": type + "; charset=utf-8", "Access-Control-Allow-Origin": ALLOWED_ORIGIN, "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(Buffer.isBuffer(body) || typeof body === "string" ? body : JSON.stringify(body));
};
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml" };
const PUB = path.join(__dirname, "public");

const server = http.createServer((req, res) => {
  try {
  const url = new URL(req.url, "http://x");
  const ip = clientIp(req);
  if (req.method === "OPTIONS") return send(res, 204, "");
  if (url.pathname === "/api/programs") return send(res, 200, PROGRAMS.map(p => ({ id: p.id, title: p.title, cls: p.cls, header: p.header, prompt: p.prompt || "",
    samples: p.tests.filter(t => !t.hidden).map(t => ({ name: t.name, input: t.input, expected: t.expected })) })));
  if (url.pathname === "/api/status") return send(res, 200, { state: S.state });
  if (url.pathname === "/api/board") return send(res, 200, board());
  if (url.pathname === "/api/admin" && req.method === "POST") {
    let b = ""; req.on("data", d => { b += d; if (b.length > 2000) req.destroy(); });
    req.on("end", () => {
      let j; try { j = JSON.parse(b); } catch (e) { return send(res, 400, { error: "Bad request" }); }
      if (!TEACHER_KEY) return send(res, 403, { error: "TEACHER_KEY is not set on the server." });
      if (tooManyFails(ip)) return send(res, 429, { error: "Too many wrong passwords — wait 10 minutes." });
      if (typeof j.key !== "string" || j.key !== TEACHER_KEY) { fails.get(ip).push(Date.now()); return send(res, 403, { error: "Wrong password." }); }
      if (j.action === "start") { if (S.state === "waiting" || !S.startedAt) S.startedAt = Date.now(); S.state = "open"; }
      else if (j.action === "stop") S.state = "closed";
      else if (j.action === "reset") S = fresh();                                             // everyone back to the name screen
      else if (j.action === "lobby") { S.state = "waiting"; S.startedAt = null; for (const t of Object.values(S.teams)) t.cells = {}; for (const p of Object.values(S.players)) p.ready = false; }  // keep teams, clear scores
      else if (j.action !== "check") return send(res, 400, { error: "Unknown action" });
      save(); send(res, 200, board());
    });
    return;
  }
  if (url.pathname === "/api/results") {
    if (tooManyFails(ip)) return send(res, 429, { error: "Too many wrong passwords — wait 10 minutes." });
    if (!TEACHER_KEY || url.searchParams.get("key") !== TEACHER_KEY) { fails.get(ip).push(Date.now()); return send(res, 403, { error: "forbidden" }); }
    const rows = [];
    if (fs.existsSync(LOG)) for (const line of fs.readFileSync(LOG, "utf8").split("\n")) { try { if (line.trim()) rows.push(JSON.parse(line)); } catch (e) {} }
    const csv = ["time,team,player,program,passed,total,compiled,points", ...rows.map(r => [r.time, JSON.stringify(r.team || r.student || ""), JSON.stringify(r.player || ""), r.program, r.passed, r.total, r.compiled, r.points == null ? "" : r.points].join(","))].join("\n");
    return send(res, 200, csv, "text/csv");
  }
  // ---- students: join, lobby, teams, ready ----
  const readJson = (cb) => { let b = ""; req.on("data", d => { b += d; if (b.length > 4000) req.destroy(); }); req.on("end", () => { let j; try { j = JSON.parse(b); } catch (e) { return send(res, 400, { error: "Bad request" }); } try { cb(j || {}); } catch (e) { console.error("api error", e); send(res, 500, { error: "Server error" }); } }); };
  if (url.pathname === "/api/join" && req.method === "POST") return readJson(j => {
    if (limited(ip)) return send(res, 429, { error: "Too many requests — wait a minute." });
    const name = cleanName(j.name);
    if (typeof j.id === "string" && S.players[j.id]) return send(res, 200, me(j.id));              // same browser, page reloaded
    if (name.length < 2) return send(res, 400, { error: "Type your name (at least 2 letters)." });
    const dup = Object.entries(S.players).find(([, p]) => nameKey(p.name) === nameKey(name));
    if (dup) {
      if (Date.now() - dup[1].lastSeen < ONLINE_MS) return send(res, 409, { error: "Someone with that name is already in the lobby. Add your last initial." });
      return send(res, 200, me(dup[0]));                                                           // same student, new device/browser
    }
    const id = newId(); S.players[id] = { name, team: null, ready: false, lastSeen: Date.now() }; soloTeam(id); save();
    send(res, 200, me(id));
  });
  if (url.pathname === "/api/me") { const m = me(String(url.searchParams.get("id") || "")); return m ? send(res, 200, m) : send(res, 404, { error: "Not in the lobby. Type your name again." }); }
  if (url.pathname === "/api/team" && req.method === "POST") return readJson(j => {
    const pl = S.players[j.id]; if (!pl) return send(res, 404, { error: "Not in the lobby. Type your name again." });
    if (S.state !== "waiting") return send(res, 409, { error: "Teams are locked once the challenge has started." });
    if (pl.ready) return send(res, 409, { error: "Un-ready first to change teams." });
    if (j.action === "join") {
      const t = S.teams[j.team];
      if (!t || !t.members.length || j.team === pl.team) return send(res, 404, { error: "That team is gone." });
      if (t.members.length >= 2) return send(res, 409, { error: "That team is full." });
      if (S.players[t.members[0]].ready) return send(res, 409, { error: "That student already pressed Ready (going solo)." });
      leaveTeam(j.id); t.members.push(j.id); pl.team = j.team;
    } else if (j.action === "leave") { leaveTeam(j.id); soloTeam(j.id); }
    else return send(res, 400, { error: "Unknown action" });
    save(); send(res, 200, me(j.id));
  });
  if (url.pathname === "/api/ready" && req.method === "POST") return readJson(j => {
    const pl = S.players[j.id]; if (!pl) return send(res, 404, { error: "Not in the lobby. Type your name again." });
    if (S.state === "waiting") { pl.ready = !!j.ready; save(); }
    send(res, 200, me(j.id));
  });
  if (url.pathname === "/api/grade" && req.method === "POST") {
    if (S.state !== "open") return send(res, 423, { error: S.state === "waiting" ? "Mr. Taylor hasn't pressed Start yet." : "Submissions are closed.", locked: true });
    if (limited(ip)) return send(res, 429, { error: "Too many submissions — wait a few minutes." });
    let body = "", received = 0;
    req.on("data", d => { received += d.length; if (received <= MAX_CODE + 2000) body += d; else if (received > 5e6) req.destroy(); });
    req.on("end", async () => {
      try {
        if (received > MAX_CODE + 2000) return send(res, 413, { error: "File too large (max 30 KB)." });
        let j; try { j = JSON.parse(body); } catch (e) { return send(res, 400, { error: "Bad request" }); }
        const prog = PROGRAMS.find(p => p.id === j.program);
        if (!prog || typeof j.code !== "string") return send(res, 400, { error: "Pick a program and upload a .java file." });
        if (j.code.length > MAX_CODE) return send(res, 413, { error: "File too large (max 30 KB)." });
        const pl = S.players[j.id]; if (!pl) return send(res, 404, { error: "You are not in the lobby any more. Reload the page and type your name again.", rejoin: true });
        if (!pl.team || !S.teams[pl.team]) soloTeam(j.id);
        const team = S.teams[pl.team], existing = team.cells[prog.id];
        if (existing && existing.solvedAt !== null) return send(res, 409, { error: "Your team already solved this one!" });
        await slot();
        try {
          const out = await grade(prog, j.code);
          let cell = null;
          if (S.state === "open") cell = record(team, prog, out);
          const tot = teamTotals(team);
          try { fs.appendFileSync(LOG, JSON.stringify({ time: new Date().toISOString(), team: teamName(team), player: pl.name, program: prog.id, passed: out.passed || 0, total: out.total || prog.tests.length, compiled: !out.error || out.error !== "Compile error", points: cell ? cell.points : null }) + "\n"); } catch (e) {}
          send(res, 200, { ...out, score: cell ? { attempts: cell.attempts, best: cell.best, total: cell.total, solved: cell.solvedAt !== null, points: cell.points } : null, team: { points: tot.points, solved: tot.solved } });
        } catch (e) { console.error("grade error", e); send(res, 500, { error: "Grader error — tell Mr. Taylor." }); }
        finally { release(); }
      } catch (e) { console.error("request error", e); send(res, 500, { error: "Grader error — tell Mr. Taylor." }); }
    });
    return;
  }
  // static files
  let f = url.pathname === "/" ? "/index.html" : url.pathname;
  try { f = decodeURIComponent(f); } catch (e) { return send(res, 400, "Bad path", "text/plain"); }
  const fp = path.join(PUB, path.normalize(f).replace(/^(\.\.[/\\])+/, ""));
  if (!fp.startsWith(PUB + path.sep) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return send(res, 404, "Not found", "text/plain");
  send(res, 200, fs.readFileSync(fp), MIME[path.extname(fp)] || "application/octet-stream");
  } catch (e) { console.error("handler error", e); try { send(res, 500, { error: "Server error" }); } catch (e2) {} }
});
server.requestTimeout = 60000; server.headersTimeout = 30000;
process.on("uncaughtException", e => console.error("uncaughtException", e));
process.on("unhandledRejection", e => console.error("unhandledRejection", e));
server.listen(PORT, () => {
  console.log("Autograder on :" + PORT + (TEACHER_KEY ? "" : "  (TEACHER_KEY is not set: teacher page will not work)"));
  selfTest();
});
