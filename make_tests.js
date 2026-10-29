// Builds tests.json by running the reference solutions. Run again after editing programs_def.js.
// Each test stores the raw expected stdout (what grading compares) and `parts`, a terminal-style transcript
// (output, then the line typed at that point) used only for display. Inputs are typed one line at a time,
// each once the program has gone quiet, the same way server.js does it.
const { execFileSync, spawn } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const progs = require("./programs_def");
const env = { ...process.env }; delete env.JAVA_TOOL_OPTIONS;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ref-"));
function run(cls, inputs) {
  return new Promise((resolve) => {
    const p = spawn("java", ["-cp", tmp, cls], { env });
    let out = "", fed = 0, quiet = null; const marks = [];
    const feed = () => { quiet = null; if (fed < inputs.length) { marks.push(out.length); p.stdin.write(inputs[fed++] + "\n"); quiet = setTimeout(feed, 150); } else p.stdin.end(); };
    const arm = (ms) => { if (quiet) clearTimeout(quiet); quiet = setTimeout(feed, ms); };
    p.stdout.setEncoding("utf8"); p.stdout.on("data", d => { out += d; if (fed < inputs.length) arm(150); });
    arm(3000);
    p.on("close", () => {
      const parts = []; let pos = 0;
      marks.forEach((mk, i) => { parts.push({ out: out.slice(pos, mk), in: inputs[i] }); pos = mk; });
      parts.push({ out: out.slice(pos) });
      resolve({ out, parts });
    });
  });
}
(async () => {
  const result = [];
  for (const p of progs) {
    fs.copyFileSync(path.join("reference", p.cls + ".java"), path.join(tmp, p.cls + ".java"));
    execFileSync("javac", [p.cls + ".java"], { cwd: tmp, env });
    const tests = [];
    for (const [list, hidden, label] of [[p.samples, false, "Sample run "], [p.hidden, true, "Hidden test "]])
      for (let k = 0; k < list.length; k++) { const r = await run(p.cls, list[k]); tests.push({ name: label + (k + 1), hidden, input: list[k], expected: r.out, parts: r.parts }); }
    result.push({ id: p.id, title: p.title, cls: p.cls, header: p.header, prompt: p.prompt || "", tests });
  }
  fs.writeFileSync("tests.json", JSON.stringify(result, null, 1));
  console.log("tests.json:", result.map(p => p.id + " " + p.tests.length).join(", "));
})();
