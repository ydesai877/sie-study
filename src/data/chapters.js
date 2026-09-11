// Cerifi SIE course outline. Edit names here if they differ from your course.
// Chapters seen in your Cerifi dashboard are filled in; the rest are placeholders.
export const CHAPTERS = [
  { n: 1, name: 'Equities' },
  { n: 2, name: 'Debt Fundamentals' },
  { n: 3, name: 'Additional Bond Features and Risks' },
  { n: 4, name: 'Corporate and U.S. Government Debt' },
  { n: 5, name: 'Municipal Debt and Money Market Instruments' },
  { n: 6, name: 'Packaged Products' },
  { n: 7, name: 'Trading Markets' },
  { n: 8, name: 'Trade Processing and Settlement' },
  { n: 9, name: 'Options' },
  { n: 10, name: 'Individual Customer Accounts and Suitability' },
  { n: 11, name: 'Other Account Types' },
  { n: 12, name: 'Retirement Plans, Variable Annuities, and Municipal Fund Securities' },
  { n: 13, name: 'Primary Market' },
  { n: 14, name: 'Act of 1934 and Other Federal and State Regulations' },
  { n: 15, name: 'Self-Regulatory Organization (SRO) Rules' },
  { n: 16, name: 'Economic Analysis and Tax Rules' },
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
  { key: 'F1', name: 'Knowledge of Capital Markets', weight: 0.16, chapters: [13, 16] },
  { key: 'F2', name: 'Understanding Products and Their Risks', weight: 0.44, chapters: [1, 2, 3, 4, 5, 6, 9, 12] },
  { key: 'F3', name: 'Trading, Customer Accounts, Prohibited Activities', weight: 0.31, chapters: [7, 10, 11] },
  { key: 'F4', name: 'Overview of Regulatory Framework', weight: 0.09, chapters: [14, 15] },
]
