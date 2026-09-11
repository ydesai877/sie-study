import { useMemo, useState } from 'react'
import { EXAM_TYPES, EXAMS_BY_TYPE } from '../lib/questions'
import { useStore } from '../lib/store'
import PracticeRunner from '../components/PracticeRunner'
import ExamRunner, { PASS, fmt } from '../components/ExamRunner'

// Same pace as the real SIE: 105 minutes for 75 questions = 1.4 minutes per question.
const MIN_PER_Q = 105 / 75

// Cerifi exams in their original form: same question order, same A-D order.
// These are the same questions that appear under each chapter on the Practice page,
// so an answer here also counts toward chapter mastery and Daily Review.
export default function Exams({ query }) {
  const params = new URLSearchParams(query || '')
  const state = useStore()
  const [type, setType] = useState(() => params.get('type') || 'mastery')
  const [run, setRun] = useState(null) // { exam, mode: 'practice' | 'setup' | 'timed', key, minutes }

  const selectType = (t) => {
    setType(t)
    history.replaceState(null, '', `#/exams?type=${t}`)
  }

  // Most recent answer for each question id.
  const last = useMemo(() => {
    const m = {}
    for (const a of state.attempts) m[a.id] = a.correct
    return m
  }, [state.attempts])

  if (run?.mode === 'practice') {
    return (
      <PracticeRunner
        key={run.key}
        qs={run.exam.qs}
        shuffle={false}
        numbered
        restartLabel="Start over"
        exitLabel={`Back to ${EXAM_TYPES.find((t) => t.type === type).label}`}
        onRestart={() => setRun({ ...run, key: Date.now() })}
        onExit={() => setRun(null)}
      />
    )
  }
  if (run?.mode === 'timed') {
    return <ExamRunner key={run.key} qs={run.exam.qs} seconds={run.minutes * 60} label={run.exam.name} shuffle={false} onExit={() => setRun(null)} />
  }

  const exams = EXAMS_BY_TYPE[type] ?? []

  return (
    <div>
      <h1>Exams</h1>
      <p className="muted">Cerifi exams in their original question order and A-D order. Practice gives feedback after each question. Timed gives no feedback until you submit. Answers here also count toward chapter mastery and Daily Review.</p>

      <div className="tabs">
        {EXAM_TYPES.map((t) => (
          <button key={t.type} className={t.type === type ? 'active' : ''} onClick={() => { selectType(t.type); setRun(null) }}>
            {t.label} <span className="muted small">({EXAMS_BY_TYPE[t.type].length})</span>
          </button>
        ))}
      </div>

      {run?.mode === 'setup' && (
        <div className="card">
          <h3>{run.exam.name} · timed</h3>
          <div className="grid">
            <label className="field"><span>Time limit (minutes)</span>
              <input type="number" min="1" value={run.minutes} onChange={(e) => setRun({ ...run, minutes: Math.max(1, Number(e.target.value)) })} />
            </label>
          </div>
          <p className="muted small">{run.exam.qs.length} questions. The default uses the real SIE pace of 1.4 minutes per question.</p>
          <div className="row">
            <button className="btn" onClick={() => setRun({ ...run, mode: 'timed', key: Date.now() })}>Start timed exam</button>
            <button className="btn secondary" onClick={() => setRun(null)}>Cancel</button>
          </div>
        </div>
      )}

      {exams.length === 0 && <div className="card muted">No questions uploaded for this section yet.</div>}

      {exams.map((exam) => {
        const answered = exam.qs.filter((q) => q.id in last)
        const right = answered.filter((q) => last[q.id]).length
        const timed = state.exams.filter((e) => e.label === exam.name)
        const lastTimed = timed[timed.length - 1]
        const best = timed.reduce((b, e) => (!b || e.score / e.total > b.score / b.total ? e : b), null)
        const pct = (e) => Math.round((e.score / e.total) * 100)
        return (
          <div key={exam.name} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0 }}>{exam.name}</h3>
                <div className="small muted">
                  {exam.qs.length} questions
                  {answered.length > 0 && ` · last answers: ${right} of ${answered.length} correct`}
                  {lastTimed && (
                    <>
                      {' · last timed: '}
                      <span style={{ color: lastTimed.score / lastTimed.total >= PASS ? 'var(--proficient)' : 'var(--weak)' }}>{pct(lastTimed)}%</span>
                      {` in ${fmt(lastTimed.seconds)}`}
                      {timed.length > 1 && ` · best: ${pct(best)}%`}
                    </>
                  )}
                </div>
              </div>
              <div className="row">
                <button className="btn sm" onClick={() => setRun({ exam, mode: 'practice', key: Date.now() })}>Practice</button>
                <button className="btn secondary sm" onClick={() => setRun({ exam, mode: 'setup', minutes: Math.round(exam.qs.length * MIN_PER_Q) })}>Timed</button>
              </div>
            </div>
            {answered.length > 0 && (
              <div className="meter" style={{ marginTop: '0.6rem' }}>
                <div style={{ width: `${(right / exam.qs.length) * 100}%`, background: 'var(--proficient)' }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
