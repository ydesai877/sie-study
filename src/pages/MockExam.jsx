import { useState } from 'react'
import { QUESTIONS, shuffle } from '../lib/questions'
import { useStore } from '../lib/store'
import ExamRunner, { PASS, fmt } from '../components/ExamRunner'

// Real SIE: 75 scored questions, 1 hour 45 minutes, passing score 70.
const EXAM_Q = 75
const EXAM_SEC = 105 * 60

export default function MockExam() {
  const state = useStore()
  const [count, setCount] = useState(Math.min(EXAM_Q, QUESTIONS.length))
  const [minutes, setMinutes] = useState(EXAM_SEC / 60)
  const [exam, setExam] = useState(null) // { qs, seconds }

  // Spread questions across chapters evenly, so one chapter cannot dominate.
  const build = () => {
    const byCh = {}
    for (const q of shuffle(QUESTIONS)) (byCh[q.chapter] ??= []).push(q)
    const buckets = Object.values(byCh)
    const qs = []
    let k = 0
    while (qs.length < count && buckets.some((b) => b.length)) {
      const b = buckets[k % buckets.length]
      if (b.length) qs.push(b.pop())
      k++
    }
    setExam({ qs: shuffle(qs), seconds: minutes * 60 })
  }

  if (exam) return <ExamRunner qs={exam.qs} seconds={exam.seconds} label="Mock Exam" onExit={() => setExam(null)} />

  const history = state.exams.slice(-10).reverse()
  return (
    <div>
      <h1>Mock Exam</h1>
      <p className="muted">Timed, no feedback until the end, questions spread across chapters. The real SIE is 75 scored questions in 1 hour 45 minutes; you need 70% to pass.</p>
      <div className="card">
        <div className="grid">
          <label className="field"><span>Questions (max {QUESTIONS.length})</span>
            <input type="number" min="5" max={QUESTIONS.length} value={count} onChange={(e) => setCount(Math.min(QUESTIONS.length, Number(e.target.value)))} />
          </label>
          <label className="field"><span>Minutes</span>
            <input type="number" min="1" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
          </label>
        </div>
        <button className="btn" disabled={QUESTIONS.length < 5} onClick={build}>Start exam</button>
        {QUESTIONS.length < EXAM_Q && <p className="muted small" style={{ marginTop: '0.5rem' }}>Add more questions to run a full 75-question exam without repeats.</p>}
      </div>
      {history.length > 0 && (
        <div className="card">
          <h3>Past exams</h3>
          <table>
            <thead><tr><th>Date</th><th>Exam</th><th className="right">Score</th><th className="right">Time</th></tr></thead>
            <tbody>
              {history.map((e) => (
                <tr key={e.ts}>
                  <td>{new Date(e.ts).toLocaleString()}</td>
                  <td>{e.label ?? 'Mock Exam'}</td>
                  <td className="right" style={{ color: e.score / e.total >= PASS ? 'var(--proficient)' : 'var(--weak)' }}>{Math.round((e.score / e.total) * 100)}% ({e.score}/{e.total})</td>
                  <td className="right">{fmt(e.seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
