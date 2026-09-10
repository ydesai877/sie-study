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
