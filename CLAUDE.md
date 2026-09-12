# sie-study

A study app for the SIE exam. React 19 + Vite 8, deployed to GitHub Pages via GitHub Actions. Content comes from screenshots of Cerifi practice exams that the user pastes in, chapter by chapter and exam by exam.

## People and machines

- Yash uses this project (shared Claude account with his brother Dev — check who is talking before you use anything from personal memory).
- Two copies of this repo exist:
  - Cloud: `/home/claude/sie-study` — Claude edits, validates, and commits here.
  - Mac: `~/repos/sie-study` — Yash reviews and runs `git commit` / `git push` here himself. Claude never pushes.
- Cross-machine workflow for every change:
  1. Edit files in the cloud repo. Run `node scripts/validate.mjs` before committing anything.
  2. Commit in the cloud repo with:
     `git -c user.name="Yash Desai" -c user.email="y2gj8gvj9d@privaterelay.appleid.com" commit -qm "<message>"`
  3. Copy changed files to `/mnt/user-data/outputs/<same relative path>`.
  4. `mcp__remote-devices__device_commit_files` with `{devicePath: "/Users/Yash/repos/sie-study/<path>", stagedPath: "/mnt/user-data/outputs/<path>"}` for each file.
  5. `mcp__remote-devices__device_bash`: `cd $HOME/mnt/repos/sie-study && node scripts/validate.mjs && git add -A; rm -f .git/index.lock; git status --short`
     - A stale `.git/index.lock` shows up after almost every `device_bash` git call — the `rm -f` step clears it. Delete permission for `/Users/Yash/repos` was already granted, so this works without asking again.
  6. Tell Yash what's staged. He runs `git commit` and `git push` on the Mac himself.

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
- Exhibits (tables, schedules, etc. shown above a question) go in the `exhibit` field; use `exhibitMono: true` for anything tabular/monospace (breakpoint schedules, calendars).

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
- IDs are prefixed per exam and sequential: `chNN-##` for chapters (actual prefixes vary, check the file), `m#-##` for mastery, `f##-##` for final, presumably `rf-##` for random final and `qq##-##` for quick quizzes (not started yet — confirm naming with Yash when that section starts, then keep it consistent).

## File naming

`src/data/questions/`:
- `ch01.json` … `ch16.json` — chapter exams (done, all 16).
- `mastery1.json` … `mastery4.json` — mastery exams I-IV (done, all 4).
- `final01.json` … `final02.json` so far, up to `final10.json` — final exams (2 of 10 done as of this writing; 80 questions each, 800 total planned).
- Not started yet: 1 random final exam file, and 49 quick quiz files (or one combined file — decide when that batch starts).

Always run `node scripts/validate.mjs` after adding/editing a file — it checks ids (unique, present), `source.type`, chapter is a positive integer, choices/answer range, and that `exhibit` is a string if present. It prints a running total question count; use that to sanity-check progress.

## App structure (for context, not usually touched during content uploads)

- `src/lib/questions.js` — loads all question files via `import.meta.glob`, exposes `QUESTIONS`, `EXAM_TYPES`, `EXAMS_BY_TYPE` (groups by `source.type` then `source.name`, Cerifi/file order preserved, exam names sorted numerically).
- `src/pages/Exams.jsx` — the Exams page: tabs per `EXAM_TYPES` (Mastery, Final, Random Final, Quick Quizzes), each exam offers Practice (instant feedback) and Timed (Cerifi-like, no feedback until submit) modes, both in Cerifi's original question/choice order (`shuffle={false}`).
- `src/components/ExamRunner.jsx` / `PracticeRunner.jsx` — shared timed/practice logic used by both the Exams page and the existing Mock Exam / Practice pages, so the same question objects and the same `recordAnswer`/`recordExam` actions back chapter mastery, SRS, and Daily Review regardless of which page was used to answer them.
- Chapter-exam questions stay embedded in their chapter (Practice page) as before — adding an Exams tab for mastery/final/etc. never removes or duplicates that; it's the same question objects, just also grouped by exam.
- localStorage key `sie-study:v1`, schema documented in `src/lib/store.js`.

## Standing reminders

- Once ALL content is uploaded (16 chapters ✅, 4 masteries ✅, 10 finals, 1 random final, 49 quick quizzes), remind Yash to export flashcards (Settings → Export backup) so they can be merged into `src/data/flashcards.json`.
- Don't push to GitHub or run `git push` — that's Yash's step on the Mac.
- Prefer starting a new chat session per big batch of work (e.g. one final exam) over piling everything into one long session — keeps each session's context small and cheap. This file exists so a fresh session doesn't need the full backstory repeated in chat.
