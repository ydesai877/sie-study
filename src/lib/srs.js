// SM-2 spaced repetition (the algorithm Anki is based on).
// quality: 0-5. For multiple choice we map: wrong = 1, right = 4, right + "easy" = 5.
// For flashcards the user self-grades: Again = 1, Hard = 3, Good = 4, Easy = 5.

const DAY = 24 * 60 * 60 * 1000

export function newItem() {
  return { ef: 2.5, interval: 0, reps: 0, due: 0, lapses: 0 }
}

export function review(item, quality, now = Date.now()) {
  const it = { ...(item ?? newItem()) }
  if (quality < 3) {
    it.reps = 0
    it.interval = 0 // back to today; the queue re-shows it in the same session
    it.lapses += 1
    it.due = now + 10 * 60 * 1000 // 10 minutes
  } else {
    if (it.reps === 0) it.interval = 1
    else if (it.reps === 1) it.interval = 6
    else it.interval = Math.round(it.interval * it.ef)
    it.reps += 1
    it.due = now + it.interval * DAY
  }
  it.ef = Math.max(1.3, it.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  return it
}

export function isDue(item, now = Date.now()) {
  return !item || item.due <= now
}

// Items with a record and due now, sorted with lapsed and overdue first.
export function dueQueue(ids, srs, now = Date.now()) {
  return ids
    .filter((id) => srs[id] && srs[id].due <= now)
    .sort((a, b) => srs[a].due - srs[b].due)
}

export function unseen(ids, srs) {
  return ids.filter((id) => !srs[id])
}
