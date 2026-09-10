# SIE Study

A personal study app for the FINRA SIE exam. It runs in the browser, deploys free on GitHub Pages, and stores progress on your device.

Built on methods with strong evidence behind them:

- **Active recall.** Every question is answered before the explanation shows.
- **Spaced repetition (SM-2).** Missed items return in 10 minutes, then 1 day, 6 days, and longer as you keep getting them right.
- **Interleaving.** Practice sessions mix chapters, and the mock exam spreads questions across chapters.
- **Feedback at the point of error.** Each question carries the exam feedback text, shown right after you answer.

## Modes

| Mode | What it does |
|---|---|
| Dashboard | Weak / Borderline / Proficient by chapter, section, or topic. 14-day accuracy trend. Streak. Due count. |
| Daily Review | The SM-2 queue: everything due today plus a set number of new items. Questions and flashcards mixed. |
| Practice | Filter by chapter and source exam. Weak questions come first. Instant feedback. |
| Flashcards | Add, edit, delete, bulk-import (Quizlet export format), and study your own term/definition cards. |
| Mock Exam | Timed, no feedback until the end. Defaults to the real exam: 75 questions, 105 minutes, 70% to pass. |
| Settings | Export and import a JSON backup. Reset. |

## Run locally

```bash
npm install
npm run dev
```

## Add questions

Questions are JSON files in `src/data/questions/`. Every file in that folder loads automatically. The format is in [`src/data/README.md`](src/data/README.md). Validate before committing:

```bash
node scripts/validate.mjs
```

Chapter names live in `src/data/chapters.js`. Edit them to match your course.

## Deploy to GitHub Pages

1. Create an empty repo on GitHub named `sie-study` (if you use a different name, change `base` in `vite.config.js` to match).
2. Push:

   ```bash
   git remote add origin https://github.com/<you>/sie-study.git
   git push -u origin main
   ```

3. In the repo, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Every push to `main` builds and deploys. The site is at `https://<you>.github.io/sie-study/`.

## Where progress is stored

Attempts, schedules, exam history, and your own flashcards are in `localStorage` under the key `sie-study:v1`. It is per browser and per device. Use **Settings → Export backup** before switching devices or clearing browser data, and **Import backup** on the other side.

## Layout

```
src/
  data/
    chapters.js        chapter names, FINRA area mapping
    flashcards.json    seed flashcards
    questions/*.json   question bank, one file per source exam
  lib/
    store.js           localStorage-backed state
    srs.js             SM-2 scheduling
    analytics.js       mastery bands, trends, streak
    questions.js       loads all question files
    actions.js         record answers, manage cards
  components/          QuestionCard, Flashcard
  pages/               Dashboard, Review, Practice, Flashcards, MockExam, Settings
scripts/validate.mjs   checks the question and flashcard files
```
