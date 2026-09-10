// All progress lives in localStorage under one key.
// Shape:
// {
//   attempts: [{ id, correct, ts, mode }],        // every answer ever given
//   srs: { [id]: { ef, interval, reps, due, lapses } }, // SM-2 state per item (question or flashcard)
//   cards: [{ id, term, definition, chapter }],   // user-added flashcards
//   exams: [{ ts, score, total, seconds, byChapter }],
//   settings: { dailyNew: 20 }
// }
import { useEffect, useState } from 'react'

const KEY = 'sie-study:v1'

const empty = () => ({ attempts: [], srs: {}, cards: [], exams: [], settings: { dailyNew: 20 } })

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.error('save failed', e)
  }
}

// Simple global store: one state object, subscribers re-render on change.
let state = loadState()
const listeners = new Set()

export function getState() {
  return state
}

export function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater }
  saveState(state)
  listeners.forEach((l) => l(state))
}

export function useStore() {
  const [s, set] = useState(state)
  useEffect(() => {
    listeners.add(set)
    return () => listeners.delete(set)
  }, [])
  return s
}

export function exportJSON() {
  return JSON.stringify(state, null, 2)
}

export function importJSON(text) {
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.attempts)) {
    throw new Error('Not a valid SIE Study backup')
  }
  setState({ ...empty(), ...parsed })
}

export function resetAll() {
  setState(empty())
}
