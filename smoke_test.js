// Smoke test against a deployed grader. Usage: node smoke_test.js https://YOUR-APP.onrender.com YOUR_TEACHER_KEY
// Joins the lobby as a test student, starts the round, uploads the 5 reference solutions, checks the leaderboard, then resets everything.
const fs = require("fs"), path = require("path");
const [URL_, KEY] = process.argv.slice(2);
if (!URL_ || !KEY) { console.error("usage: node smoke_test.js <url> <teacher key>"); process.exit(2); }
const base = URL_.replace(/\/$/, "");
const api = async (p, body) => { const r = await fetch(base + p, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}); return { status: r.status, body: await r.json().catch(() => null) }; };
let bad = 0; const check = (name, ok, info = "") => { console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  <-- " + info)); if (!ok) bad++; };
(async () => {
  const t0 = Date.now();
  let r = await api("/api/status"); check("server reachable (/api/status)", r.status === 200 && r.body && r.body.state, JSON.stringify(r));
  r = await api("/api/admin", { key: KEY, action: "check" }); check("teacher key accepted", r.status === 200, JSON.stringify(r.body));
  if (r.status !== 200) process.exit(1);
  r = await api("/api/admin", { key: KEY, action: "reset" }); check("Reset before test", r.status === 200);
  r = await api("/api/join", { name: "Smoke Test" }); check("student can join the lobby", r.status === 200 && r.body.me && r.body.lobby.teams.length >= 1, JSON.stringify(r.body).slice(0, 200));
  const id = r.body.me.id, first = r.body.lobby.teams[0];
  r = await api("/api/team", { id, action: "join", team: first.id }); check(`student picks team ${first.emoji} ${first.name}`, r.status === 200 && r.body.team && r.body.team.id === first.id, JSON.stringify(r.body).slice(0, 200));
  r = await api("/api/ready", { id, ready: true }); check("Ready works", r.status === 200 && r.body.me.ready);
  r = await api("/api/admin", { key: KEY, action: "start" }); check("Start -> LIVE", r.body && r.body.state === "open");
  const progs = (await api("/api/programs")).body;
  for (const p of progs) {
    const code = fs.readFileSync(path.join(__dirname, "reference", p.cls + ".java"), "utf8");
    const s = Date.now(); r = await api("/api/grade", { id, program: p.id, code });
    check(`${p.cls} reference: ${r.body && r.body.passed}/${r.body && r.body.total} in ${((Date.now() - s) / 1000).toFixed(1)} s`, r.status === 200 && r.body.passed === r.body.total, JSON.stringify(r.body).slice(0, 300));
  }
  const b = (await api("/api/board")).body;
  check("leaderboard shows the team with 5 solved and points", b.rows.some(x => x.names === "Smoke Test" && x.solved === 5 && x.points > 700), JSON.stringify(b.rows));
  r = await api("/api/grade", { id, program: "hauntedDoor", code: "public class HauntedDoor { public static void main(String[] a) { Runtime.getRuntime().exec(\"id\"); } }" });
  check("banned code is rejected (solved programs reject re-uploads first, so this checks a 409 or the filter)", r.status === 409 || (r.body && /only use java.util.Scanner/.test(r.body.error || "")), JSON.stringify(r.body));
  r = await api("/api/admin", { key: KEY, action: "stop" }); check("Stop -> closed", r.body && r.body.state === "closed");
  r = await api("/api/grade", { id, program: "candycheck", code: "x" }); check("upload while closed -> 423", r.status === 423);
  r = await api("/api/admin", { key: KEY, action: "reset" }); check("Reset -> waiting, lobby and board empty", r.body && r.body.state === "waiting" && r.body.rows.length === 0 && r.body.lobby.players === 0);
  console.log(`\n${bad ? bad + " FAILED" : "ALL GOOD"} in ${((Date.now() - t0) / 1000).toFixed(1)} s. The board is reset and ready for class.`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
