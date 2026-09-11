import { useEffect, useState } from 'react'
import { chapterName } from '../data/chapters'
import { recordAnswer, recordExam } from '../lib/actions'
import QuestionCard from './QuestionCard'

export const PASS = 0.7

export function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Timed exam: no feedback until the end, then score, chapter breakdown, and missed questions.
// qs: questions in the order to show them. seconds: time limit.
// label: saved with the result (for example "Mastery Exam II"). shuffle: shuffle A-D choices.
export default function ExamRunner({ qs, seconds, label = 'Mock Exam', shuffle = true, onExit }) {
  const [exam, setExam] = useState(() => {
    const now = Date.now()
    return { i: 0, picks: {}, start: now, deadline: now + seconds * 1000, salt: String(now) }
  })
  const [result, setResult] = useState(null)
  const [now, setNow] = useState(Date.now())

  const finish = () => {
    if (!exam) return
    const { picks, start } = exam
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
    const res = { ts: Date.now(), label, score: correct, total: qs.length, seconds: Math.round((Date.now() - start) / 1000), byChapter }
    recordExam(res)
    setResult({ ...res, missed: qs.filter((q) => picks[q.id]?.ok !== true), picks })
    setExam(null)
  }

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
        <h1>{label} result</h1>
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
                  <div className="small muted">
                    {!shuffle && `Question ${qs.indexOf(q) + 1} · `}
                    {chapterName(q.chapter)}{q.topic ? ` · ${q.topic}` : ''}
                    {result.picks[q.id] == null && ' · skipped'}
                  </div>
                  {q.exhibit && <div className={`exhibit small${q.exhibitMono ? ' mono' : ''}`}>{q.exhibit}</div>}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{q.question}</div>
                  <div className="small" style={{ color: 'var(--proficient)' }}>Answer: {!shuffle && `${'ABCD'[q.answer]}. `}{q.choices[q.answer]}</div>
                  {q.explanation && <div className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{q.explanation}</div>}
                </div>
              ))}
            </details>
          )}
          <div className="row" style={{ marginTop: '1rem' }}>
            <button className="btn" onClick={onExit}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  const { i, picks } = exam
  const left = Math.max(0, Math.round((exam.deadline - now) / 1000))
  const q = qs[i]
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className={`timer ${left < 300 ? 'low' : ''}`}>{fmt(left)} left</span>
        <span className="muted small">{label} · {Object.keys(picks).length} of {qs.length} answered</span>
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
        shuffle={shuffle}
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
