# Java Autograder — Halloween Pair Challenge

Students upload a `.java` file, pick the program, and see which tests pass. Sample runs show input / expected / their output;
hidden tests show pass or fail only. Every submission is logged.

## Running the activity (Start button + leaderboard)
- Open `/teacher.html` on your computer, type your `TEACHER_KEY` password. The chip shows **Waiting to start**.
- Students open the main page. Until you press **Start**, their Run button is locked and says "Waiting for Mr. Taylor to press Start..."
- Press **Start**: the chip turns **LIVE**, the timer starts, uploads unlock on every student page within ~2 seconds.
- Put `/board.html` on the projector: a live leaderboard (pairs ranked by programs fully solved, then total tests passed, then who finished first). Each cell shows a check with the time it was solved, or the best partial score like 7/10.
- **Stop** closes uploads (Start again resumes the same timer). **Reset leaderboard** clears everything for the next class.
- Pairs are identified by the name they type, ignoring capital letters and extra spaces, so tell them to type it the same way each time (e.g. "Kostia & Matthew").
- See `CLASS_CHECKLIST.md` for the minute-by-minute plan.

## What's in the box
- `server.js` — the grader (plain Node, no npm install). Compiles with `javac`, runs each test with a 3-second limit and 64 MB memory.
- `grader.policy` — Java security-manager policy for student programs (grants nothing: no files, network, exec, env).
- `tests.json` — the test cases (4 sample runs + 6–8 hidden tests per program). Stays on the server; students never download it.
- `public/` — the upload page (`index.html`), projector board (`board.html`), teacher controls (`teacher.html`), `config.js`.
- `Dockerfile`, `render.yaml` — Node 22 + JDK 17, runs as a non-root user; Render Blueprint for one-click setup.
- `smoke_test.js` — `node smoke_test.js https://YOUR-APP.onrender.com YOUR_KEY` starts a round, uploads the 5 reference solutions, checks the board, resets.
- `programs_def.js`, `make_tests.js`, `reference/` — your source of truth. Edit the inputs in `programs_def.js` (or a reference solution), then run `node make_tests.js` (needs a JDK) to rebuild `tests.json`.

## Easiest deploy: one service on Render (page + grader together)
1. Put this folder in a GitHub repo (it is already a git repo with one commit: create an empty repo on GitHub, then
   `git remote add origin <url>` and `git push -u origin main`).
2. Render.com → New → **Blueprint** → connect the repo. `render.yaml` creates a Docker web service and asks you for `TEACHER_KEY`.
   (Or New → Web Service → Runtime **Docker**, and add the `TEACHER_KEY` environment variable by hand.)
3. Plan: **Starter** (0.5 CPU) is recommended for class day — a burst of 6 submissions finishes in ~9 s. **Free** (0.1 CPU) works
   but each submission takes ~8 s even when nobody else is uploading, the service sleeps after 15 min idle (first load ~30–60 s), and
   12 pairs submitting together would wait a minute or more. You can switch the plan back to Free after class.
4. Wait for "Live", then from this folder run `node smoke_test.js https://YOUR-APP.onrender.com YOUR_KEY`. It should print ALL GOOD.
5. Give students the URL. Your scores: `https://YOUR-APP.onrender.com/api/results?key=YOUR_KEY` (CSV; opens in Sheets/Excel), or the "Download CSV" link on the teacher page.

Fly.io, Railway, or any VPS with Docker work the same way. Netlify can't compile Java by itself.

Optional environment variables: `TEACHER_KEY` (required for the teacher page), `ALLOWED_ORIGIN` (default `*`), `RUN_MS` (per-test time limit, default 3000; only raise on a very slow host), `MAX_PARALLEL` (default 2).

## If you want the page on Netlify
1. Deploy the `public/` folder to Netlify.
2. Edit `public/config.js`: `window.API_URL = "https://YOUR-APP.onrender.com";`
3. On the grader service set `ALLOWED_ORIGIN` = your Netlify URL (e.g. `https://my-class.netlify.app`).

## Run locally to try it
```
TEACHER_KEY=test node server.js     # needs Node 18+ and a JDK 17–21 on the PATH
open http://localhost:8080
```
On this Mac the JDK is Homebrew's: `export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"` first. The server prints a
`SELF-TEST OK` line at startup once it has compiled and run a test program under the sandbox; if it says the security manager is OFF, fix the JDK before class.

Docker: `docker build -t javagrader . && docker run -p 8080:8080 -e TEACHER_KEY=test javagrader` (Colima is installed on this Mac: `colima start` first).

## Safety notes
Student code is untrusted. Four layers:
1. **Source filter** — only `import java.util.Scanner;` / `import java.util.*;` are allowed, anywhere in the file. Unicode escapes (`Runtime`) are decoded the way javac does before checking; comments and string contents are ignored so a comment like `// process the list` can't trip it. Rejected: `java.io/net/nio/sql/rmi/security/awt`, `java.lang.reflect/invoke/ref/management`, `java.util.concurrent/logging/prefs/zip/jar`, `javax`, `jdk.*`, `sun.*`, `Runtime`, `Process*`, `Thread*`, `Timer`, `Executor*`, `ForkJoin`, `parallelStream`, `ClassLoader`, `Unsafe`, `MethodHandle`, `ServiceLoader`, `Cleaner`, `Class.forName`, `.getClass()/getMethod()/getDeclared*/invoke()/newInstance()/getResource*()`, `System.exit/getenv/getProperty/setIn/setOut/load*/console/...`, and `import static`. The error message names the offending token.
2. **Java security manager** with `grader.policy` (empty grant): even if something slips past the filter, the JVM denies file, network, exec, environment, system-property and private-reflection access. (JDK 17–21; the server checks this at startup and warns if it had to turn it off.)
3. **Resource limits** — 3 s per test, 64 MB heap, 48 MB metaspace, 20 KB output, 30 KB source, 20 s compile, at most 2 submissions graded at once, and a per-process limit of ~1000 threads (so a thread bomb dies inside its own JVM instead of taking the container down). The JVM gets a scrubbed environment (no `TEACHER_KEY`).
4. **Container** — runs as the unprivileged `grader` user; temp directories are deleted after every submission.

Also: 300 submissions per IP per 5 minutes; 20 wrong teacher passwords per IP per 10 minutes.

- Free hosts wipe the disk on restart, so `submissions.jsonl` may reset and the first request after idle can take ~30–60 s while it wakes up. Open the page a minute before class.
- The check compares output exactly (trailing spaces and the final newline are ignored), so prompts must match the handout character for character. Those prompts are the same as the sample runs.
- Windows `\r\n` files, a UTF-8 byte-order mark, and an IDE `package` line are all accepted (the package line is ignored and noted).
- The page asks only for the student's name(s); no accounts. Check your school's data-privacy rules before students submit work to a site you host.
