import { useEffect, useState } from 'react'
import { QUESTIONS, shuffle } from '../lib/questions'
import { chapterName } from '../data/chapters'
import { recordAnswer, recordExam } from '../lib/actions'
import { useStore } from '../lib/store'
import QuestionCard from '../components/QuestionCard'

// Real SIE: 75 scored questions, 1 hour 45 minutes, passing score 70.
const EXAM_Q = 75
const EXAM_SEC = 105 * 60
const PASS = 0.7

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MockExam() {
  const state = useStore()
  const [count, setCount] = useState(Math.min(EXAM_Q, QUESTIONS.length))
  const [minutes, setMinutes] = useState(EXAM_SEC / 60)
  const [exam, setExam] = useState(null) // { qs, i, picks: {id: correct}, start, deadline }
  const [result, setResult] = useState(null)

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
    const now = Date.now()
    setResult(null)
    setExam({ qs: shuffle(qs), i: 0, picks: {}, start: now, deadline: now + minutes * 60 * 1000, salt: String(now) })
  }

  const finish = () => {
    if (!exam) return
    const { qs, picks, start } = exam
    let correct = 0
    const byChapter = {}
    for (const q of qs) {
      const ok = picks[q.id]?.ok === true
      if (ok) correct++
      const c = (byChapter[q.chapter] ??= { n: 0, correct: 0 })
      c.n++
      if (ok) c.correct++
      recordAnswer(q.id, ok, 'exam', { schedule: false })
    }
    const res = { ts: Date.now(), score: correct, total: qs.length, seconds: Math.round((Date.now() - start) / 1000), byChapter }
    recordExam(res)
    setResult({ ...res, missed: qs.filter((q) => picks[q.id]?.ok !== true) })
    setExam(null)
  }

  // Timer
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!exam) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [exam])
  useEffect(() => {
    if (exam && now >= exam.deadline) finish()
  })

  if (result) {
    const pct = Math.round((result.score / result.total) * 100)
    const passed = result.score / result.total >= PASS
    return (
      <div>
        <h1>Exam result</h1>
        <div className="card">
          <div className="row" style={{ gap: '2rem' }}>
            <div className="stat"><div className="value" style={{ color: passed ? 'var(--proficient)' : 'var(--weak)' }}>{pct}%</div><div className="label">{passed ? 'Pass' : 'Below 70%'} · {result.score} of {result.total}</div></div>
            <div className="stat"><div className="value">{fmt(result.seconds)}</div><div className="label">time used</div></div>
          </div>
          <h3 style={{ marginTop: '1rem' }}>By chapter</h3>
          <table>
            <tbody>
              {Object.entries(result.byChapter).sort((a, b) => a[1].correct / a[1].n - b[1].correct / b[1].n).map(([ch, v]) => (
                <tr key={ch}>
                  <td>{chapterName(Number(ch))}</td>
                  <td className="right">{v.correct}/{v.n}</td>
                  <td style={{ width: 160 }}><div className="meter"><div style={{ width: `${(v.correct / v.n) * 100}%`, background: v.correct / v.n >= 0.8 ? 'var(--proficient)' : v.correct / v.n >= 0.6 ? 'var(--borderline)' : 'var(--weak)' }} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.missed.length > 0 && (
            <details style={{ marginTop: '1rem' }}>
              <summary>Review missed questions ({result.missed.length})</summary>
              {result.missed.map((q) => (
                <div key={q.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--line)' }}>
                  <div className="small muted">{chapterName(q.chapter)}{q.topic ? ` · ${q.topic}` : ''}</div>
                  <div>{q.question}</div>
                  <div className="small" style={{ color: 'var(--proficient)' }}>Answer: {q.choices[q.answer]}</div>
                  {q.explanation && <div className="small muted">{q.explanation}</div>}
                </div>
              ))}
            </details>
          )}
          <div className="row" style={{ marginTop: '1rem' }}>
            <button className="btn" onClick={() => setResult(null)}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  if (exam) {
    const { qs, i, picks } = exam
    const left = Math.max(0, Math.round((exam.deadline - now) / 1000))
    const q = qs[i]
    return (
      <div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className={`timer ${left < 300 ? 'low' : ''}`}>{fmt(left)} left</span>
          <span className="muted small">{Object.keys(picks).length} of {qs.length} answered</span>
          <button className="btn danger sm" onClick={() => { if (confirm('Submit the exam now?')) finish() }}>Submit exam</button>
        </div>
        <div className="progressbar"><div style={{ width: `${(i / qs.length) * 100}%` }} /></div>
        <QuestionCard
          key={q.id}
          q={q}
          index={i}
          total={qs.length}
          mode="exam"
          salt={exam.salt}
          initialPick={picks[q.id]?.idx ?? null}
          onAnswer={(ok, idx) => setExam((e) => ({ ...e, picks: { ...e.picks, [q.id]: { ok, idx } } }))}
          onNext={() => (i + 1 >= qs.length ? finish() : setExam((e) => ({ ...e, i: e.i + 1 })))}
        />
        <div className="row">
          <button className="btn secondary sm" disabled={i === 0} onClick={() => setExam((e) => ({ ...e, i: e.i - 1 }))}>Previous</button>
        </div>
      </div>
    )
  }

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
            <thead><tr><th>Date</th><th className="right">Score</th><th className="right">Time</th></tr></thead>
            <tbody>
              {history.map((e) => (
                <tr key={e.ts}>
                  <td>{new Date(e.ts).toLocaleString()}</td>
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
