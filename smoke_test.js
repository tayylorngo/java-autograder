// Smoke test against a deployed grader. Usage: node smoke_test.js https://YOUR-APP.onrender.com YOUR_TEACHER_KEY
// Starts the round, uploads the 5 reference solutions, checks the leaderboard, then resets so the board is clean.
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
  r = await api("/api/admin", { key: KEY, action: "start" }); check("Start -> LIVE", r.body && r.body.state === "open");
  const progs = (await api("/api/programs")).body;
  for (const p of progs) {
    const code = fs.readFileSync(path.join(__dirname, "reference", p.cls + ".java"), "utf8");
    const s = Date.now(); r = await api("/api/grade", { student: "Smoke Test", program: p.id, code });
    check(`${p.cls} reference: ${r.body && r.body.passed}/${r.body && r.body.total} in ${((Date.now() - s) / 1000).toFixed(1)} s`, r.status === 200 && r.body.passed === r.body.total, JSON.stringify(r.body).slice(0, 300));
  }
  const b = (await api("/api/board")).body;
  check("leaderboard shows Smoke Test with 5 solved", b.rows.some(x => x.name === "Smoke Test" && x.solved === 5), JSON.stringify(b.rows));
  r = await api("/api/grade", { student: "Smoke Test", program: "candycheck", code: "public class CandyCheck { public static void main(String[] a) { Runtime.getRuntime().exec(\"id\"); } }" });
  check("banned code is rejected", r.body && /only use java.util.Scanner/.test(r.body.error || ""), JSON.stringify(r.body));
  r = await api("/api/admin", { key: KEY, action: "stop" }); check("Stop -> closed", r.body && r.body.state === "closed");
  r = await api("/api/grade", { student: "Smoke Test", program: "candycheck", code: "x" }); check("upload while closed -> 423", r.status === 423);
  r = await api("/api/admin", { key: KEY, action: "reset" }); check("Reset -> waiting, board empty", r.body && r.body.state === "waiting" && r.body.rows.length === 0);
  console.log(`\n${bad ? bad + " FAILED" : "ALL GOOD"} in ${((Date.now() - t0) / 1000).toFixed(1)} s. The board is reset and ready for class.`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
