# Halloween Pair Challenge — Class Checklist (Fri 10/30, 48 min, 12 students in 6 pairs)

**URLs** (fill in): grader `https://java-autograder-z1mg.onrender.com` · teacher page `/teacher.html` · projector `/board.html`
**Teacher password:** the `TEACHER_KEY` you set on Render.

## The night before
- [ ] Render service shows **Live**. Plan is **Starter** (or accept ~8 s per submission on Free).
- [ ] `node smoke_test.js https://YOUR-APP.onrender.com YOUR_KEY` prints **ALL GOOD** (it leaves the board reset).
- [ ] Open `/teacher.html`, type the password, the chip says **Waiting to start** and the lobby is empty. Press **Reset everything** if it isn't.
- [ ] Render logs show `SELF-TEST OK ... security manager ON`.
- [ ] Students know the plan: type your name → pick a team (Pumpkin, Ghost, Zombie, Alien, Robot, Dragon; 2 per team) → Ready → code offline → upload per program. The prompts, class names and headers are on their screen after Start.
- [ ] Decide the time limit and set `ROUND_MINUTES` on Render to match (default 40): the speed bonus counts down over that window.

## 5 minutes before the bell
- [ ] Load the grader URL once so the service is awake (Free plan sleeps after 15 min idle).
- [ ] Projector: `/board.html` full-screen (it shows the lobby: who is teamed up and ready).
- [ ] Your laptop: `/teacher.html` with password typed in. Leave it open; Stop/Reset are one click.
- [ ] Write the URL on the board.

## Minute 0–5: lobby
- [ ] Everyone opens the URL and types **their own name** (first name + last initial). Each person lands in the lobby with the six team cards.
- [ ] Pairs pick the same team: both click **Join** on, say, Ghost. Teams hold 2. Anyone can go solo on an empty team.
- [ ] Each student presses **Ready**. Ready locks them in (nobody can join that team or leave it). The projector shows every team, who is on it, and "x of y teams ready".
- [ ] Explain: after Start you get 5 tabs, one per program, each with the prompt, the exact class name and header, all test cases, and its own upload. Code in your editor, save as `ClassName.java`, upload. Unlimited uploads, but every compiled upload after the first on a program costs 5 points (max 30), so test against the listed cases first. Solving fast earns a bonus. Partners can split programs; while one of you is uploading program 2, the other can't submit program 2 but can work on anything else.
- [ ] Wrong teams or a stray name? **Manage teams** on the teacher page moves or removes anyone, before or after Start.
- [ ] Rule reminder: only `import java.util.Scanner;` — anything else (files, threads, `System.exit`) is rejected with a message and does not count as an attempt.

## Minute 5: press Start
- [ ] When the Start button says all teams are ready, press **Start**. Teams lock, the chip turns **LIVE**, student screens switch to the challenge within ~3 seconds.
- [ ] Pressed Start too early? **Back to lobby** keeps the teams and clears the timer and scores.

## During (minute 5–43)
- [ ] A team that finishes all five sees a 🏁 finish page with the live leaderboard; they can still be passed on points until you press Stop. Finished teams show 🏁 and their time on the projector.
- [ ] Watch the board. A ✓ with a time and points means fully solved; `7/10` is the best partial score so far. Ranking is by points.
- Common student messages and what they mean:
  - "The class must be declared as: public class CandyCheck" → wrong class name or missing `public`.
  - "Required method header not found exactly as given" → they changed the method signature; the tests still run.
  - "NAME is running tests on this program right now" → their partner uploaded the same program seconds ago; wait for that result.
  - "Compile error" → javac output is shown; fix and resubmit.
  - "Took too long" → infinite loop, or reading more input than the prompt gives.
  - "Program crashed: NoSuchElementException" → an extra `in.next…()` call.
  - "This program may only use java.util.Scanner... Not allowed: X" → remove X.
  - "Your team already solved this one!" → their partner already got the ✓; pick another tab.
  - "Submissions are closed" banner → you pressed Stop (press Start again; the timer resumes).
  - A student is back at the name screen → you pressed Reset everything, or their browser lost its storage; they type the same name and are back in their team.
  - A student who arrives late sees the team cards instead of the programs → they pick any team with a free spot and are in.
  - Two students with the same name → the second is asked to add a last initial.
  - "Could not reach the grader" → service asleep or restarting; wait 30 s and retry. Check the Render dashboard.
- [ ] If the whole class stalls: Render dashboard → Logs. A manual **Restart** takes ~1 min; scores survive if the disk didn't reset, otherwise Start again (board starts empty).

## Minute 43: press Stop
- [ ] Press **Stop**. Uploads lock; the board freezes. Announce the top 3.
- [ ] Download the CSV (link on the teacher page, or `/api/results?key=YOUR_KEY`) before leaving — the file can vanish on a restart.

## After class
- [ ] **Reset everything** (next class starts with an empty lobby), or leave it if you want to show the board later.
- [ ] Optionally switch the Render plan back to Free, or suspend the service.
