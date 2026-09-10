// Mastery scoring, mirrors the Cerifi Weak / Borderline / Proficient bands.
// A question's score is the accuracy of its last 3 attempts, weighted toward the latest.
// A group (topic, section, chapter) is the mean of its questions' scores; unseen questions count as 0.

export const BANDS = {
  weak: { label: 'Weak', min: 0, color: 'var(--weak)' },
  borderline: { label: 'Borderline', min: 0.6, color: 'var(--borderline)' },
  proficient: { label: 'Proficient', min: 0.8, color: 'var(--proficient)' },
}

export function band(score) {
  if (score >= BANDS.proficient.min) return 'proficient'
  if (score >= BANDS.borderline.min) return 'borderline'
  return 'weak'
}

const WEIGHTS = [0.5, 0.3, 0.2] // latest first

export function questionScores(attempts) {
  const byId = {}
  for (const a of attempts) (byId[a.id] ??= []).push(a)
  const scores = {}
  for (const id in byId) {
    const last = byId[id].slice(-3).reverse()
    let num = 0
    let den = 0
    last.forEach((a, i) => {
      num += (a.correct ? 1 : 0) * WEIGHTS[i]
      den += WEIGHTS[i]
    })
    scores[id] = num / den
  }
  return scores
}

export function groupScore(ids, scores) {
  if (!ids.length) return { score: 0, seen: 0 }
  let sum = 0
  let seen = 0
  for (const id of ids) {
    if (id in scores) {
      sum += scores[id]
      seen++
    }
  }
  return { score: sum / ids.length, seen }
}

export function groupBy(questions, keyFn) {
  const groups = {}
  for (const q of questions) (groups[keyFn(q)] ??= []).push(q)
  return groups
}

// Daily accuracy for the last N days.
export function dailySeries(attempts, days = 14, now = Date.now()) {
  const out = []
  for (let d = days - 1; d >= 0; d--) {
    const start = startOfDay(now - d * 86400000)
    const end = start + 86400000
    const todays = attempts.filter((a) => a.ts >= start && a.ts < end)
    const correct = todays.filter((a) => a.correct).length
    out.push({ day: start, n: todays.length, correct, acc: todays.length ? correct / todays.length : null })
  }
  return out
}

export function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// Consecutive days (ending today or yesterday) with at least one attempt.
export function streak(attempts, now = Date.now()) {
  const days = new Set(attempts.map((a) => startOfDay(a.ts)))
  let day = startOfDay(now)
  if (!days.has(day)) day -= 86400000
  let n = 0
  while (days.has(day)) {
    n++
    day -= 86400000
  }
  return n
}
