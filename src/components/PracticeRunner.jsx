import { useState } from 'react'
import { chapterName } from '../data/chapters'
import { recordAnswer } from '../lib/actions'
import QuestionCard from './QuestionCard'

// Practice session: instant feedback after each question, summary at the end.
// Wrong answers go into the Daily Review queue through recordAnswer.
// numbered: show the question's position in the list on the summary (for Cerifi exams).
export default function PracticeRunner({ qs, shuffle = true, numbered = false, onRestart, onExit, restartLabel = 'Another round', exitLabel = 'Change filters' }) {
  const [i, setI] = useState(0)
  const [results, setResults] = useState([])
  const correct = results.filter((r) => r.correct).length

  if (i >= qs.length) {
    const pct = qs.length ? Math.round((correct / qs.length) * 100) : 0
    const missed = results.filter((r) => !r.correct)
    return (
      <div>
        <h1>Session complete</h1>
        <div className="card">
          <div className="row">
            <div className="stat"><div className="value">{pct}%</div><div className="label">{correct} of {qs.length} correct</div></div>
          </div>
          {missed.length > 0 && (
            <>
              <h3 style={{ marginTop: '1rem' }}>Missed</h3>
              <table>
                <tbody>
                  {missed.map((r) => (
                    <tr key={r.q.id}>
                      <td className="small muted">{numbered && `Q${qs.indexOf(r.q) + 1} · `}{chapterName(r.q.chapter)}{r.q.topic ? ` · ${r.q.topic}` : ''}</td>
                      <td>{r.q.question}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div className="row" style={{ marginTop: '1rem' }}>
            <button className="btn" onClick={onRestart}>{restartLabel}</button>
            <button className="btn secondary" onClick={onExit}>{exitLabel}</button>
          </div>
        </div>
      </div>
    )
  }

  const q = qs[i]
  return (
    <div>
      <div className="progressbar"><div style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <QuestionCard
        key={q.id}
        q={q}
        index={i}
        total={qs.length}
        mode="practice"
        shuffle={shuffle}
        onAnswer={(ok) => {
          recordAnswer(q.id, ok, 'practice')
          setResults((r) => [...r, { q, correct: ok }])
        }}
        onNext={() => setI((n) => n + 1)}
      />
      <button className="btn secondary sm" onClick={onExit}>End session</button>
    </div>
  )
}
