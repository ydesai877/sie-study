import { setState } from './store'
import { review } from './srs'

// Record one multiple-choice answer. Updates attempts and the SM-2 schedule.
// mode: 'practice' | 'review' | 'exam'
export function recordAnswer(id, correct, mode, { schedule = true } = {}) {
  setState((s) => {
    const attempts = [...s.attempts, { id, correct, ts: Date.now(), mode }]
    const srs = schedule ? { ...s.srs, [id]: review(s.srs[id], correct ? 4 : 1) } : s.srs
    return { ...s, attempts, srs }
  })
}

// Self-graded flashcard. quality: 1 (again), 3 (hard), 4 (good), 5 (easy)
export function gradeCard(id, quality) {
  setState((s) => ({
    ...s,
    attempts: [...s.attempts, { id, correct: quality >= 3, ts: Date.now(), mode: 'flashcard' }],
    srs: { ...s.srs, [id]: review(s.srs[id], quality) },
  }))
}

export function addCard(card) {
  const id = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  setState((s) => ({ ...s, cards: [...s.cards, { ...card, id }] }))
  return id
}

export function updateCard(id, patch) {
  setState((s) => ({ ...s, cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
}

export function deleteCard(id) {
  setState((s) => {
    const srs = { ...s.srs }
    delete srs[id]
    return { ...s, cards: s.cards.filter((c) => c.id !== id), srs }
  })
}

export function recordExam(result) {
  setState((s) => ({ ...s, exams: [...s.exams, result] }))
}
