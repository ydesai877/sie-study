import { QUESTIONS, SEED_CARDS } from './questions'

// The app has two subjects. SIE is the original one. Accounting has its own flashcards.
// Accounting card ids start with "acc-" (see addCard in actions.js). That prefix is the only
// marker, so attempts stay in the right subject even after a card is deleted.
export const isAccountingId = (id) => String(id).startsWith('acc-')
export const isAccounting = (card) => isAccountingId(card.id)

// Flashcards that belong to a subject. SIE also gets the seed cards.
export function cardsFor(subject, cards) {
  return subject === 'accounting'
    ? cards.filter(isAccounting)
    : [...SEED_CARDS, ...cards.filter((c) => !isAccounting(c))]
}

// Every item id that can appear in a subject's Daily Review. Accounting has no questions.
export function idsFor(subject, cards) {
  const ids = cardsFor(subject, cards).map((c) => c.id)
  return subject === 'accounting' ? ids : [...QUESTIONS.map((q) => q.id), ...ids]
}

export const attemptsFor = (subject, attempts) =>
  attempts.filter((a) => (subject === 'accounting') === isAccountingId(a.id))
