# Question and flashcard data

## Files

- `questions/*.json` — one file per source exam. Every file is loaded automatically.
- `flashcards.json` — seed flashcards. Cards you add in the app are stored in your browser and can be exported.
- `chapters.js` — chapter names and FINRA area mapping.

## Question schema

```json
{
  "id": "ch06-e-01",
  "source": { "type": "chapter", "name": "Chapter 6 Exam" },
  "chapter": 6,
  "section": "Section 4: Mutual Fund Expenses and Share Classes",
  "topic": "12b-1 Fees",
  "question": "Which of the following is TRUE about 12b-1 fees?",
  "choices": ["...", "...", "...", "..."],
  "answer": 2,
  "explanation": "Feedback text from the exam.",
  "tags": ["fees"]
}
```

Rules:

- `id` must be unique across all files. Convention: `ch06-e-01` (chapter exam), `m1-07` (mastery), `f03-22` (final), `rf-10` (random final), `qq14-03` (quick quiz).
- `answer` is the zero-based index into `choices`.
- `source.type` is one of `chapter`, `mastery`, `final`, `random_final`, `quick_quiz`.
- `chapter` is required. `section` and `topic` are optional but power the dashboard breakdown.
- `explanation` is optional but strongly recommended. Active recall works best when the feedback is right there.

Run `node scripts/validate.mjs` to check every file before committing.
