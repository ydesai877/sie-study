# sie-study

A study app for the SIE exam. React 19 + Vite 8, deployed to GitHub Pages via GitHub Actions. Content comes from screenshots of Cerifi practice exams that the user pastes in, chapter by chapter and exam by exam.

## People and machines

- Yash uses this project (shared Claude account with his brother Dev — check who is talking before you use anything from personal memory).
- The repo lives on the Mac at `~/repos/sie-study`. Claude edits it in place through the device bridge, where it mounts at `$HOME/mnt/sie-study` in `device_bash`. There is no cloud copy of the repo — don't clone one. Content uploads are plain JSON edits; staging files across machines just creates two copies that drift.
- Workflow for every change:
  1. Edit in place with `device_bash`. Write a whole file with a quoted heredoc, or merge a new batch with a short python script. Keep scratch files in `$HOME` **outside** `mnt/` — anything written inside the repo shows up in `git status` and you may not be able to delete it (see below).
  2. `cd $HOME/mnt/sie-study && node scripts/validate.mjs` — node is installed on the Mac. Must report 0 errors.
  3. Stage: `cd $HOME/mnt/sie-study && git add -A; rm -f .git/index.lock; git status --short`
  4. Tell Yash what's staged. He runs `git commit` and `git push` on the Mac himself. Claude never commits and never pushes.

### The `.git/index.lock` problem (read this before your first git call)

Git leaves a stale 0-byte `.git/index.lock` after almost every `device_bash` git call. It blocks your next `git add` *and* Yash's `git commit`, so it has to be removed.

Deletion is disabled by default in every new session: the first `rm -f` fails with `Operation not permitted`. Fix it once, early, with `device_request_delete_permission` on `/Users/Yash/repos/sie-study`. It lasts the whole session.

**Word the `reason` carefully.** Yash declined this once because "enable file deletion in this folder" read as though the project itself was at risk. Name the actual files — something like: *"Only to remove git's stale .git/index.lock (0 bytes, blocks your commits) and my scratch file. No question data or project files are deleted."* If he still declines, don't retry: leave the lock in place and tell him to run `rm -f .git/index.lock` on the Mac before committing.

## Content pipeline

Yash uploads Cerifi screenshots in batches (e.g. "Q21-40"). For each question:

- If two or more screenshots are one question (e.g. labeled `20.1`/`20.2`, or he says "these are the same question"), combine them into a single question entry. Don't split one Cerifi question into two entries.
- Preserve Cerifi's question text and explanation as closely as possible.
- **Edit-note policy (always follow this):** if you change or add to Cerifi's text for any reason — fixing a factual error, cleaning up stray HTML tags, clarifying something outdated — append a note to the `explanation` field, and never overwrite Cerifi's original wording. Two note styles, both keep the original text visible:
  - Content note (you're adding context, not changing Cerifi's text):
    `[Note - added by Claude] <what you added and why>.`
  - Edit note (you changed Cerifi's actual text):
    `[Edit note - added by Claude] Original: "<verbatim original>." Edited: <what changed and why>.`
- **No Area of Study shown:** when Cerifi's screen doesn't show a chapter/Area of Study for a question, pick the chapter yourself by subject matter and add:
  `[Note - added by Claude] Cerifi's screen showed no Area of Study for this question. I filed it under Chapter N (<name>), where <topic> is covered.`
- If Yash later supplies his own manually-checked chapter list for an exam, treat it as authoritative and cross-check/update against it.
- Exhibits (tables, schedules, etc. shown above a question) go in the `exhibit` field; use `exhibitMono: true` for anything tabular/monospace (breakpoint schedules, calendars). Cerifi's question text stays verbatim — lift only the table out of it, leaving the lead-in sentence ("...the following share classes:") in place. See `f1-49` and `f3-36` for the pattern.
- Check the arithmetic on any calculation question against Cerifi's stated answer before filing it, and report that you did.

## Question schema

Each question file is a JSON array of objects:

```json
{
  "id": "f1-05",
  "source": { "type": "final", "name": "Final Exam 1" },
  "chapter": 11,
  "topic": "optional short topic string",
  "exhibit": "optional string, shown above the question",
  "exhibitMono": true,
  "question": "question text",
  "choices": ["A", "B", "C", "D"],
  "answer": 0,
  "explanation": "explanation text, plus any [Note]/[Edit note] lines"
}
```

- `answer` is a 0-based index into `choices`.
- `source.type` must be one of: `chapter`, `mastery`, `final`, `random_final`, `quick_quiz` (enforced by `scripts/validate.mjs`).
- `source.name` is the display name used on the Exams page (e.g. `"Mastery Exam II"`, `"Final Exam 3"`) — sorted numerically there, so name it consistently.
- `chapter` is the chapter number (1-16, see `src/data/chapters.js` for names/FINRA areas).
- IDs are prefixed per exam and sequential: `chNN-##` for chapters (actual prefixes vary, check the file), `m#-##` for mastery, `f#-##` for final (e.g. `f3-01` … `f3-80`), presumably `rf-##` for random final and `qq##-##` for quick quizzes (not started yet — confirm naming with Yash when that section starts, then keep it consistent).
- After merging a batch, assert the ids form an unbroken sequence before writing. A silent gap is the easiest mistake to make and the hardest to spot later.

## File naming

`src/data/questions/`:
- `ch01.json` … `ch16.json` — chapter exams (done, all 16).
- `mastery1.json` … `mastery4.json` — mastery exams I-IV (done, all 4).
- `final01.json` … `final10.json` — final exams, 80 questions each, 800 total planned. Done so far: `final01`, `final02`, `final03`, `final04`, `final05` (5 of 10).
- Not started yet: 1 random final exam file, and 49 quick quiz files (or one combined file — decide when that batch starts).

Always run `node scripts/validate.mjs` after adding/editing a file — it checks ids (unique, present), `source.type`, chapter is a positive integer, choices/answer range, and that `exhibit` is a string if present. It prints a running total question count; use that to sanity-check progress. Totals at milestones: 710 after Final Exam 2, 790 after Final Exam 3, 870 after Final Exam 4, 950 after Final Exam 5.

## App structure (for context, not usually touched during content uploads)

- `src/lib/questions.js` — loads all question files via `import.meta.glob`, exposes `QUESTIONS`, `EXAM_TYPES`, `EXAMS_BY_TYPE` (groups by `source.type` then `source.name`, Cerifi/file order preserved, exam names sorted numerically).
- `src/pages/Exams.jsx` — the Exams page: tabs per `EXAM_TYPES` (Mastery, Final, Random Final, Quick Quizzes), each exam offers Practice (instant feedback) and Timed (Cerifi-like, no feedback until submit) modes, both in Cerifi's original question/choice order (`shuffle={false}`).
- `src/components/ExamRunner.jsx` / `PracticeRunner.jsx` — shared timed/practice logic used by both the Exams page and the existing Mock Exam / Practice pages, so the same question objects and the same `recordAnswer`/`recordExam` actions back chapter mastery, SRS, and Daily Review regardless of which page was used to answer them.
- Chapter-exam questions stay embedded in their chapter (Practice page) as before — adding an Exams tab for mastery/final/etc. never removes or duplicates that; it's the same question objects, just also grouped by exam.
- localStorage key `sie-study:v1`, schema documented in `src/lib/store.js`.

## Standing reminders

- Once ALL content is uploaded (16 chapters ✅, 4 masteries ✅, 10 finals, 1 random final, 49 quick quizzes), remind Yash to export flashcards (Settings → Export backup) so they can be merged into `src/data/flashcards.json`.
- Don't push to GitHub or run `git push` — that's Yash's step on the Mac.
- Prefer starting a new chat session per big batch of work (one final exam per session works well) over piling everything into one long session — keeps each session's context small and cheap. This file exists so a fresh session doesn't need the full backstory repeated in chat.
