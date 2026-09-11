import seedCards from '../data/flashcards.json'

// Load every question file under src/data/questions at build time.
const modules = import.meta.glob('../data/questions/*.json', { eager: true, import: 'default' })

export const QUESTIONS = Object.values(modules).flat()
export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))
export const SEED_CARDS = seedCards

export function sourceLabel(q) {
  return q.source?.name ?? q.source?.type ?? 'Unknown'
}

export const SOURCES = [...new Set(QUESTIONS.map(sourceLabel))].sort()

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Deterministic rng seeded by a string, so a question's choice order is stable
// across re-mounts within a session (needed for Previous in the mock exam).
function seeded(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// Shuffle answer choices but remember where the correct one moved.
// `salt` varies the order between sessions while keeping it stable within one.
export function shuffleChoices(q, salt = '') {
  const idx = shuffle(q.choices.map((_, i) => i), seeded(q.id + salt))
  return { choices: idx.map((i) => q.choices[i]), answer: idx.indexOf(q.answer) }
}

// Exam sections for the Exams page. Chapter tests stay on the Practice page.
export const EXAM_TYPES = [
  { type: 'mastery', label: 'Mastery Exams' },
  { type: 'final', label: 'Final Exams' },
  { type: 'random_final', label: 'Random Final' },
  { type: 'quick_quiz', label: 'Quick Quizzes' },
]

// { [type]: [{ name, qs }] }, with questions in Cerifi order (file order)
// and exams sorted by name, numbers compared as numbers (Final Exam 2 before 10).
export const EXAMS_BY_TYPE = (() => {
  const out = {}
  for (const { type } of EXAM_TYPES) {
    const byName = new Map()
    for (const q of QUESTIONS) {
      if (q.source?.type !== type) continue
      const name = sourceLabel(q)
      if (!byName.has(name)) byName.set(name, [])
      byName.get(name).push(q)
    }
    out[type] = [...byName].map(([name, qs]) => ({ name, qs })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  }
  return out
})()
