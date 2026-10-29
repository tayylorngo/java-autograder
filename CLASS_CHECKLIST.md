# Halloween Pair Challenge — Class Checklist (Fri 10/30, 48 min, 12 students in 6 pairs)

**URLs** (fill in): grader `https://________.onrender.com` · teacher page `/teacher.html` · projector `/board.html`
**Teacher password:** the `TEACHER_KEY` you set on Render.

## The night before
- [ ] Render service shows **Live**. Plan is **Starter** (or accept ~8 s per submission on Free).
- [ ] `node smoke_test.js https://YOUR-APP.onrender.com YOUR_KEY` prints **ALL GOOD** (it leaves the board reset).
- [ ] Open `/teacher.html`, type the password, the chip says **Waiting to start**. Press **Reset leaderboard** if it doesn't.
- [ ] Render logs show `SELF-TEST OK ... security manager ON`.
- [ ] Students have the 5 prompts, the required class names and method headers, and a reminder to save as `ClassName.java`.

## 5 minutes before the bell
- [ ] Load the grader URL once so the service is awake (Free plan sleeps after 15 min idle).
- [ ] Projector: `/board.html` full-screen (it shows "Get ready" until you press Start).
- [ ] Your laptop: `/teacher.html` with password typed in. Leave it open; Stop/Reset are one click.
- [ ] Write the URL on the board.

## Minute 0–3: setup
- [ ] Pairs open the URL, type their pair name exactly once as agreed, e.g. `Kostia & Matthew` (same spelling every time, capitals and extra spaces don't matter).
- [ ] Explain: pick the program from the dropdown, upload the `.java` file, press **Run tests**. Unlimited resubmits. Sample runs show expected vs. your output; hidden tests only show pass/fail.
- [ ] Rule reminder: only `import java.util.Scanner;` — anything else (files, threads, `System.exit`) is rejected with a message.

## Minute 3: press Start
- [ ] Press **Start** on the teacher page. Chip turns **LIVE**; student pages unlock within ~3 seconds.

## During (minute 3–43)
- [ ] Watch the board. A ✓ with a time means fully solved; `7/10` means best partial score.
- Common student messages and what they mean:
  - "The class must be declared as: public class CandyCheck" → wrong class name or missing `public`.
  - "Required method header not found exactly as given" → they changed the method signature; the tests still run.
  - "Compile error" → javac output is shown; fix and resubmit.
  - "Took too long" → infinite loop, or reading more input than the prompt gives.
  - "Program crashed: NoSuchElementException" → an extra `in.next…()` call.
  - "This program may only use java.util.Scanner... Not allowed: X" → remove X.
  - "Mr. Taylor hasn't pressed Start yet" / "Submissions are closed" → you pressed Stop, or the service restarted (press Start again; the timer resumes).
  - "Could not reach the grader" → service asleep or restarting; wait 30 s and retry. Check the Render dashboard.
- [ ] If the whole class stalls: Render dashboard → Logs. A manual **Restart** takes ~1 min; scores survive if the disk didn't reset, otherwise Start again (board starts empty).

## Minute 43: press Stop
- [ ] Press **Stop**. Uploads lock; the board freezes. Announce the top 3.
- [ ] Download the CSV (link on the teacher page, or `/api/results?key=YOUR_KEY`) before leaving — the file can vanish on a restart.

## After class
- [ ] **Reset leaderboard** (next class starts clean), or leave it if you want to show it later.
- [ ] Optionally switch the Render plan back to Free, or suspend the service.
