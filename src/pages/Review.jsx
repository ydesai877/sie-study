import { useMemo, useState } from 'react'
import { useStore, getState } from '../lib/store'
import { QUESTION_BY_ID, QUESTIONS, SEED_CARDS, shuffle } from '../lib/questions'
import { dueQueue, unseen } from '../lib/srs'
import { recordAnswer, gradeCard } from '../lib/actions'
import QuestionCard from '../components/QuestionCard'
import Flashcard from '../components/Flashcard'

const isDueNow = (id, srs) => srs[id] == null || srs[id].due <= Date.now()

// Daily Review: everything due under SM-2, plus a few new items per day.
export default function Review() {
  const state = useStore()
  const cardsById = useMemo(
    () => Object.fromEntries([...SEED_CARDS, ...state.cards].map((c) => [c.id, c])),
    [state.cards],
  )
  // session: { queue: [ids], current: id | null, done: n }
  const [session, setSession] = useState(null)

  const allIds = [...QUESTIONS.map((q) => q.id), ...Object.keys(cardsById)]
  const due = dueQueue(allIds, state.srs)
  const fresh = unseen(allIds, state.srs)

  const pickNext = (queue) => queue.find((id) => isDueNow(id, getState().srs)) ?? null

  const build = (withNew) => {
    const extra = withNew ? shuffle(fresh).slice(0, state.settings.dailyNew ?? 20) : []
    const queue = [...due, ...extra]
    setSession({ queue, current: pickNext(queue), done: 0 })
  }

  const advance = () => {
    setSession((s) => {
      const queue = [...s.queue.filter((x) => x !== s.current), s.current]
      return { queue, current: pickNext(queue), done: s.done + 1 }
    })
  }

  if (!session) {
    return (
      <div>
        <h1>Daily Review</h1>
        <p className="muted">Spaced repetition (SM-2). Items you miss come back in 10 minutes, then 1 day, 6 days, and longer as you keep getting them right.</p>
        <div className="grid">
          <div className="card stat"><div className="value">{due.length}</div><div className="label">due now</div></div>
          <div className="card stat"><div className="value">{fresh.length}</div><div className="label">never reviewed</div></div>
        </div>
        <div className="row">
          <button className="btn" disabled={!due.length} onClick={() => build(false)}>Review due ({due.length})</button>
          <button className="btn secondary" disabled={!due.length && !fresh.length} onClick={() => build(true)}>
            Due + {Math.min(state.settings.dailyNew ?? 20, fresh.length)} new
          </button>
        </div>
      </div>
    )
  }

  const { queue, current, done } = session
  if (!current) {
    const backSoon = dueQueue(queue, state.srs, Date.now() + 15 * 60 * 1000).length
    return (
      <div>
        <h1>Review complete</h1>
        <div className="card">
          <p>{done} items reviewed.</p>
          {backSoon > 0 && (
            <p className="muted">
              {backSoon} missed item(s) come back within 15 minutes.{' '}
              <button className="btn secondary sm" onClick={() => setSession((s) => ({ ...s, current: pickNext(s.queue) }))}>Check again</button>
            </p>
          )}
          <button className="btn" onClick={() => setSession(null)}>Back</button>
        </div>
      </div>
    )
  }

  const remaining = queue.filter((id) => isDueNow(id, state.srs)).length
  const q = QUESTION_BY_ID[current]

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span className="muted small">{remaining} remaining · {done} done</span>
        <button className="btn secondary sm" onClick={() => setSession(null)}>Stop</button>
      </div>
      {q ? (
        <QuestionCard
          key={current}
          q={q}
          mode="practice"
          onAnswer={(ok) => recordAnswer(q.id, ok, 'review')}
          onNext={advance}
        />
      ) : (
        <Flashcard
          key={current}
          card={cardsById[current]}
          onGrade={(quality) => {
            gradeCard(current, quality)
            advance()
          }}
        />
      )}
    </div>
  )
}
