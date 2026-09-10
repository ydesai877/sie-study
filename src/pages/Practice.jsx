import { useMemo, useState } from 'react'
import { QUESTIONS, SOURCES, sourceLabel, shuffle } from '../lib/questions'
import { CHAPTERS, chapterName } from '../data/chapters'
import { useStore } from '../lib/store'
import { questionScores, band } from '../lib/analytics'
import { recordAnswer } from '../lib/actions'
import QuestionCard from '../components/QuestionCard'

// Practice quiz: pick chapters and sources, answer with instant feedback.
// query string can preselect: #/practice?chapter=6&focus=weak
export default function Practice({ query }) {
  const params = new URLSearchParams(query || '')
  const state = useStore()
  const scores = useMemo(() => questionScores(state.attempts), [state.attempts])

  const [chapters, setChapters] = useState(() => {
    const c = params.get('chapter')
    return c ? [Number(c)] : CHAPTERS.map((c) => c.n)
  })
  const [sources, setSources] = useState(SOURCES)
  const [focus, setFocus] = useState(params.get('focus') || 'all') // all | weak | unseen | missed
  const [count, setCount] = useState(20)
  const [session, setSession] = useState(null) // { qs, i, correct }

  const availableChapters = useMemo(() => [...new Set(QUESTIONS.map((q) => q.chapter))].sort((a, b) => a - b), [])

  const pool = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (!chapters.includes(q.chapter)) return false
      if (!sources.includes(sourceLabel(q))) return false
      const s = scores[q.id]
      if (focus === 'unseen') return s == null
      if (focus === 'weak') return s == null || band(s) === 'weak'
      if (focus === 'missed') return s != null && s < 1
      return true
    })
  }, [chapters, sources, focus, scores])

  const start = () => {
    // Weak questions first, then unseen, then the rest, all shuffled within tier.
    const tier = (q) => (scores[q.id] == null ? 1 : band(scores[q.id]) === 'weak' ? 0 : 2)
    const ordered = [0, 1, 2].flatMap((t) => shuffle(pool.filter((q) => tier(q) === t)))
    setSession({ qs: ordered.slice(0, count), i: 0, correct: 0, results: [] })
  }

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  if (session) {
    const { qs, i, correct, results } = session
    if (i >= qs.length) {
      const pct = qs.length ? Math.round((correct / qs.length) * 100) : 0
      return (
        <div>
          <h1>Session complete</h1>
          <div className="card">
            <div className="row">
              <div className="stat"><div className="value">{pct}%</div><div className="label">{correct} of {qs.length} correct</div></div>
            </div>
            {results.some((r) => !r.correct) && (
              <>
                <h3 style={{ marginTop: '1rem' }}>Missed</h3>
                <table>
                  <tbody>
                    {results.filter((r) => !r.correct).map((r) => (
                      <tr key={r.q.id}>
                        <td className="small muted">{chapterName(r.q.chapter)}{r.q.topic ? ` · ${r.q.topic}` : ''}</td>
                        <td>{r.q.question}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn" onClick={start}>Another round</button>
              <button className="btn secondary" onClick={() => setSession(null)}>Change filters</button>
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
          onAnswer={(ok) => {
            recordAnswer(q.id, ok, 'practice')
            setSession((s) => ({ ...s, correct: s.correct + (ok ? 1 : 0), results: [...s.results, { q, correct: ok }] }))
          }}
          onNext={() => setSession((s) => ({ ...s, i: s.i + 1 }))}
        />
        <button className="btn secondary sm" onClick={() => setSession(null)}>End session</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Practice</h1>
      <p className="muted">Answer questions with instant feedback. Wrong answers go into the Daily Review queue automatically.</p>

      <div className="card">
        <h3>Chapters</h3>
        <div className="row small" style={{ marginBottom: '0.5rem' }}>
          <button className="btn secondary sm" onClick={() => setChapters(availableChapters)}>All</button>
          <button className="btn secondary sm" onClick={() => setChapters([])}>None</button>
        </div>
        <div className="checklist">
          {availableChapters.map((n) => (
            <label key={n}>
              <input type="checkbox" checked={chapters.includes(n)} onChange={() => toggle(chapters, setChapters, n)} />
              {chapterName(n)}
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Sources</h3>
        <div className="checklist">
          {SOURCES.map((s) => (
            <label key={s}>
              <input type="checkbox" checked={sources.includes(s)} onChange={() => toggle(sources, setSources, s)} />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <label className="field">
            <span>Focus</span>
            <select value={focus} onChange={(e) => setFocus(e.target.value)}>
              <option value="all">All questions (weak first)</option>
              <option value="weak">Weak and unseen only</option>
              <option value="unseen">Never answered</option>
              <option value="missed">Missed at least once recently</option>
            </select>
          </label>
          <label className="field">
            <span>Number of questions</span>
            <input type="number" min="1" max="200" value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
        </div>
        <div className="row">
          <button className="btn" disabled={!pool.length} onClick={start}>Start ({Math.min(count, pool.length)} of {pool.length} available)</button>
        </div>
      </div>
    </div>
  )
}
