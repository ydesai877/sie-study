import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { cardsFor, attemptsFor } from '../lib/subjects'
import { questionScores, groupScore, groupBy, band, dailySeries, streak } from '../lib/analytics'
import { dueQueue } from '../lib/srs'
import { Chip, Meter, Trend } from './Dashboard'

const NO_CHAPTER = 'No chapter'

// Accounting dashboard. Built only from flashcard grades (Typing does not record results).
export default function AccountingDashboard() {
  const state = useStore()
  const cards = useMemo(() => cardsFor('accounting', state.cards), [state.cards])
  const attempts = useMemo(() => attemptsFor('accounting', state.attempts), [state.attempts])
  const scores = useMemo(() => questionScores(attempts), [attempts])

  const ids = cards.map((c) => c.id)
  const due = dueQueue(ids, state.srs).length
  const studied = ids.filter((id) => id in scores).length
  const series = dailySeries(attempts)
  const today = series[series.length - 1]
  const overall = attempts.length ? attempts.filter((a) => a.correct).length / attempts.length : 0

  const groups = Object.entries(groupBy(cards, (c) => (c.chapter ? String(c.chapter).trim() : NO_CHAPTER)))
    .map(([label, cs]) => {
      const g = groupScore(cs.map((c) => c.id), scores)
      return { label, n: cs.length, ...g, band: band(g.score) }
    })
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label, undefined, { numeric: true }))

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Accounting</p>
      <div className="grid">
        <div className="card stat"><div className="value">{due}</div><div className="label">due for review <a href="#/acc/review">start</a></div></div>
        <div className="card stat"><div className="value">{streak(attempts)}</div><div className="label">day streak</div></div>
        <div className="card stat"><div className="value">{studied}/{cards.length}</div><div className="label">cards studied</div></div>
        <div className="card stat"><div className="value">{Math.round(overall * 100)}%</div><div className="label">all-time accuracy · today {today.n ? `${Math.round(today.acc * 100)}% of ${today.n}` : 'none yet'}</div></div>
      </div>

      {cards.length === 0 ? (
        <div className="card">
          <p>You have no Accounting flashcards yet. <a href="#/acc/practice?tab=flashcards">Add cards</a> and give each one a chapter name.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>Last 14 days</h3>
            <p className="muted small">Line: daily accuracy. Bars: cards graded.</p>
            <Trend series={series} />
          </div>

          <div className="card">
            <h3>Progress by chapter</h3>
            <p className="muted small">Accuracy comes from your flashcard grades. Cards you have not graded count as weak.</p>
            <table style={{ marginTop: '0.75rem' }}>
              <thead><tr><th>Chapter</th><th>Status</th><th>Score</th><th className="right">Studied</th><th></th></tr></thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.label}>
                    <td>{g.label}</td>
                    <td><Chip b={g.band} /></td>
                    <td style={{ width: 160 }}><Meter score={g.score} /><span className="small muted">{Math.round(g.score * 100)}%</span></td>
                    <td className="right small">{g.seen}/{g.n}</td>
                    <td className="right"><a className="small" href="#/acc/practice?tab=typing">Type</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
