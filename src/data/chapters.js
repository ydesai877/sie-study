// Cerifi SIE course outline. Edit names here if they differ from your course.
// Chapters seen in your Cerifi dashboard are filled in; the rest are placeholders.
export const CHAPTERS = [
  { n: 1, name: 'Equities' },
  { n: 2, name: 'Debt Fundamentals' },
  { n: 3, name: 'Additional Bond Features and Risks' },
  { n: 4, name: 'Corporate and U.S. Government Debt' },
  { n: 5, name: 'Municipal Debt' },
  { n: 6, name: 'Packaged Products' },
  { n: 7, name: 'Alternative and Retirement Products' },
  { n: 8, name: 'Chapter 8' },
  { n: 9, name: 'Options' },
  { n: 10, name: 'Chapter 10' },
  { n: 11, name: 'Chapter 11' },
  { n: 12, name: 'Chapter 12' },
  { n: 13, name: 'Chapter 13' },
  { n: 14, name: 'Chapter 14' },
  { n: 15, name: 'Chapter 15' },
  { n: 16, name: 'Chapter 16' },
]

export const chapterName = (n) => {
  const c = CHAPTERS.find((c) => c.n === n)
  return c ? `Ch ${c.n}: ${c.name}` : `Ch ${n}`
}

// Source exam types. `weight` is only used to label the mock exam mix.
export const SOURCE_TYPES = {
  chapter: 'Chapter Exam',
  mastery: 'Mastery Exam',
  final: 'Final Exam',
  random_final: 'Random Final',
  quick_quiz: 'Quick Quiz',
}

// FINRA SIE content-area weights, used to build a realistic mock exam.
// Map each chapter to one of the four FINRA functions.
export const FINRA_AREAS = [
  { key: 'F1', name: 'Knowledge of Capital Markets', weight: 0.16, chapters: [] },
  { key: 'F2', name: 'Understanding Products and Their Risks', weight: 0.44, chapters: [1, 2, 3, 4, 5, 6, 7, 9] },
  { key: 'F3', name: 'Trading, Customer Accounts, Prohibited Activities', weight: 0.31, chapters: [] },
  { key: 'F4', name: 'Overview of Regulatory Framework', weight: 0.09, chapters: [] },
]
