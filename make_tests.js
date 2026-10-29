// Builds tests.json by running the reference solutions. Run again after editing programs_def.js.
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const progs = require("./programs_def");
const env = { ...process.env }; delete env.JAVA_TOOL_OPTIONS;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ref-"));
const out = [];
for (const p of progs) {
  fs.copyFileSync(path.join("reference", p.cls + ".java"), path.join(tmp, p.cls + ".java"));
  execFileSync("javac", [p.cls + ".java"], { cwd: tmp, env });
  const run = (inp) => spawnSync("java", ["-cp", tmp, p.cls], { input: inp.join("\n") + "\n", env, encoding: "utf8" }).stdout;
  out.push({ id: p.id, title: p.title, cls: p.cls, header: p.header, prompt: p.prompt || "",
    tests: [...p.samples.map((i, k) => ({ name: "Sample run " + (k + 1), hidden: false, input: i, expected: run(i) })),
            ...p.hidden.map((i, k) => ({ name: "Hidden test " + (k + 1), hidden: true, input: i, expected: run(i) }))] });
}
fs.writeFileSync("tests.json", JSON.stringify(out, null, 1));
console.log("tests.json:", out.map(p => p.id + " " + p.tests.length).join(", "));
