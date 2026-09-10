import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { QUESTIONS, SEED_CARDS } from '../lib/questions'
import { chapterName } from '../data/chapters'
import { questionScores, groupScore, groupBy, band, BANDS, dailySeries, streak } from '../lib/analytics'
import { dueQueue } from '../lib/srs'

const Chip = ({ b }) => <span className={`chip ${b}`}>{BANDS[b].label}</span>

function Meter({ score }) {
  return (
    <div className="meter"><div style={{ width: `${Math.round(score * 100)}%`, background: BANDS[band(score)].color }} /></div>
  )
}

// Donut of weak / borderline / proficient counts, plain SVG.
function Donut({ counts }) {
  const total = counts.weak + counts.borderline + counts.proficient || 1
  const r = 44
  const c = 2 * Math.PI * r
  let offset = 0
  const segs = ['weak', 'borderline', 'proficient'].map((k) => {
    const frac = counts[k] / total
    const seg = { k, frac, dash: `${frac * c} ${c - frac * c}`, offset }
    offset += frac * c
    return seg
  })
  return (
    <div className="row" style={{ gap: '1.5rem' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Proficiency breakdown">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="14" />
        {segs.map((s) => (
          <circle key={s.k} cx="60" cy="60" r={r} fill="none" stroke={BANDS[s.k].color} strokeWidth="14"
            strokeDasharray={s.dash} strokeDashoffset={-s.offset} transform="rotate(-90 60 60)" />
        ))}
      </svg>
      <div>
        {segs.map((s) => (
          <div key={s.k} className="small" style={{ marginBottom: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: BANDS[s.k].color, marginRight: 6 }} />
            {BANDS[s.k].label}: {counts[s.k]} ({Math.round(s.frac * 100)}%)
          </div>
        ))}
      </div>
    </div>
  )
}

// 14-day accuracy and volume, plain SVG.
function Trend({ series }) {
  const w = 420
  const h = 120
  const pad = 24
  const maxN = Math.max(1, ...series.map((d) => d.n))
  const x = (i) => pad + (i / (series.length - 1)) * (w - pad * 2)
  const pts = series.map((d, i) => (d.acc == null ? null : `${x(i)},${pad + (1 - d.acc) * (h - pad * 2)}`)).filter(Boolean)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: 'auto' }} role="img" aria-label="Daily accuracy, last 14 days">
      {series.map((d, i) => (
        <rect key={d.day} x={x(i) - 8} y={h - pad - (d.n / maxN) * (h - pad * 2)} width="16" height={(d.n / maxN) * (h - pad * 2)} fill="var(--accent-soft)" rx="2" />
      ))}
      <line x1={pad} x2={w - pad} y1={pad + 0.3 * (h - pad * 2)} y2={pad + 0.3 * (h - pad * 2)} stroke="var(--line)" strokeDasharray="3 3" />
      {pts.length > 1 && <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" />}
      {series.map((d, i) => d.acc != null && <circle key={d.day} cx={x(i)} cy={pad + (1 - d.acc) * (h - pad * 2)} r="3" fill="var(--accent)" />)}
      <text x={pad} y={h - 6} fontSize="10" fill="var(--muted)">{new Date(series[0].day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>
      <text x={w - pad} y={h - 6} fontSize="10" fill="var(--muted)" textAnchor="end">today</text>
      <text x={w - pad} y={pad + 0.3 * (h - pad * 2) - 3} fontSize="9" fill="var(--muted)" textAnchor="end">70%</text>
    </svg>
  )
}

export default function Dashboard() {
  const state = useStore()
  const scores = useMemo(() => questionScores(state.attempts), [state.attempts])
  const [level, setLevel] = useState('chapter') // chapter | section | topic
  const [only, setOnly] = useState(null) // band filter

  const allIds = [...QUESTIONS.map((q) => q.id), ...SEED_CARDS.map((c) => c.id), ...state.cards.map((c) => c.id)]
  const due = dueQueue(allIds, state.srs).length
  const answered = Object.keys(scores).length
  const total = QUESTIONS.length
  const series = dailySeries(state.attempts)
  const today = series[series.length - 1]
  const overall = state.attempts.length ? state.attempts.filter((a) => a.correct).length / state.attempts.length : 0

  // Group by chapter / section / topic and score each group.
  const keyFn = { chapter: (q) => q.chapter, section: (q) => `${q.chapter}|${q.section ?? 'General'}`, topic: (q) => `${q.chapter}|${q.section ?? 'General'}|${q.topic ?? 'General'}` }[level]
  const groups = Object.entries(groupBy(QUESTIONS, keyFn)).map(([key, qs]) => {
    const g = groupScore(qs.map((q) => q.id), scores)
    const parts = String(key).split('|')
    return { key, chapter: Number(parts[0]), label: level === 'chapter' ? chapterName(Number(parts[0])) : parts.slice(1).join(' › '), n: qs.length, ...g, band: band(g.score) }
  }).sort((a, b) => a.score - b.score || a.chapter - b.chapter)

  const counts = { weak: 0, borderline: 0, proficient: 0 }
  for (const g of groups) counts[g.band]++
  const shown = only ? groups.filter((g) => g.band === only) : groups

  const weakest = groups.filter((g) => g.band === 'weak').slice(0, 3)
  const best = groups.filter((g) => g.band === 'proficient').slice(-3).reverse()

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="grid">
        <div className="card stat"><div className="value">{due}</div><div className="label">due for review <a href="#/review">start</a></div></div>
        <div className="card stat"><div className="value">{streak(state.attempts)}</div><div className="label">day streak</div></div>
        <div className="card stat"><div className="value">{answered}/{total}</div><div className="label">questions seen</div></div>
        <div className="card stat"><div className="value">{Math.round(overall * 100)}%</div><div className="label">all-time accuracy · today {today.n ? `${Math.round(today.acc * 100)}% of ${today.n}` : 'none yet'}</div></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card">
          <h3>Proficiency by {level}</h3>
          <p className="muted small">Unseen questions count as weak, the same way Cerifi does.</p>
          <Donut counts={counts} />
        </div>
        <div className="card">
          <h3>Last 14 days</h3>
          <p className="muted small">Line: daily accuracy. Bars: questions answered.</p>
          <Trend series={series} />
        </div>
      </div>

      {(weakest.length > 0 || best.length > 0) && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {weakest.length > 0 && (
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}><h3>Needs work</h3><Chip b="weak" /></div>
              {weakest.map((g) => (
                <div key={g.key} style={{ marginBottom: 6 }}>
                  <a href={`#/practice?chapter=${g.chapter}&focus=weak`}>{g.label}</a>
                  <span className="muted small"> · {Math.round(g.score * 100)}% · {g.seen}/{g.n} seen</span>
                </div>
              ))}
            </div>
          )}
          {best.length > 0 && (
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}><h3>Great job</h3><Chip b="proficient" /></div>
              {best.map((g) => (
                <div key={g.key} style={{ marginBottom: 6 }}>{g.label}<span className="muted small"> · {Math.round(g.score * 100)}%</span></div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Proficiency for course topics</h3>
          <div className="row">
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: 'auto' }}>
              <option value="chapter">By chapter</option>
              <option value="section">By section</option>
              <option value="topic">By topic</option>
            </select>
            {['weak', 'borderline', 'proficient'].map((b) => (
              <button key={b} className={`btn sm ${only === b ? '' : 'secondary'}`} onClick={() => setOnly(only === b ? null : b)}>
                {BANDS[b].label} ({counts[b]})
              </button>
            ))}
          </div>
        </div>
        <table style={{ marginTop: '0.75rem' }}>
          <thead><tr><th>{level}</th><th>Status</th><th>Score</th><th className="right">Seen</th><th></th></tr></thead>
          <tbody>
            {shown.map((g) => (
              <tr key={g.key}>
                <td>{level !== 'chapter' && <span className="muted small">Ch {g.chapter} · </span>}{g.label}</td>
                <td><Chip b={g.band} /></td>
                <td style={{ width: 160 }}><Meter score={g.score} /><span className="small muted">{Math.round(g.score * 100)}%</span></td>
                <td className="right small">{g.seen}/{g.n}</td>
                <td className="right"><a className="small" href={`#/practice?chapter=${g.chapter}&focus=weak`}>Practice</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
