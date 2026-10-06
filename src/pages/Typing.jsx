import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { SEED_CARDS, shuffle } from '../lib/questions'
import { CHAPTERS, chapterName } from '../data/chapters'

const NONE = 'none'
const chapterKey = (c) => (c.chapter ? Number(c.chapter) : NONE)
// You type the term, then the definition, as one line of text.
const targetOf = (c) => `${c.term}: ${c.definition}`.replace(/\s+/g, ' ').trim()
const BLOCKED_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

// Typing: type out your flashcards, one chapter at a time. Forgiving mode:
// wrong letters turn red, but you keep typing. Results are not saved anywhere.
export default function Typing() {
  const state = useStore()
  const all = useMemo(() => [...SEED_CARDS, ...state.cards], [state.cards])
  const [shuffled, setShuffled] = useState(true)
  const [run, setRun] = useState(null) // { key, label, cards }

  const counts = useMemo(() => {
    const m = {}
    for (const c of all) m[chapterKey(c)] = (m[chapterKey(c)] || 0) + 1
    return m
  }, [all])

  const chapterNums = useMemo(
    () => [...new Set([...CHAPTERS.map((c) => c.n), ...Object.keys(counts).filter((k) => k !== NONE).map(Number)])].sort((a, b) => a - b),
    [counts],
  )

  const start = (k) => {
    const cards = all.filter((c) => chapterKey(c) === k)
    if (!cards.length) return
    setRun({ key: Date.now(), label: k === NONE ? 'No chapter' : chapterName(k), chapterKey: k, cards: shuffled ? shuffle(cards) : cards })
  }

  if (run) {
    return <TypingSession key={run.key} label={run.label} cards={run.cards} onRestart={() => start(run.chapterKey)} onExit={() => setRun(null)} />
  }

  return (
    <div>
      <h2>Typing</h2>
      <p className="muted">Pick one chapter. Type each card as <code>term: definition</code>. Wrong letters turn red and you keep going. You see accuracy and speed after each card.</p>

      {all.length === 0 ? (
        <div className="card"><p>You have no flashcards yet. Add cards in the Flashcards tab. Set a chapter on each card so it shows up here.</p></div>
      ) : (
        <div className="card">
          <div className="checklist" style={{ marginBottom: '0.5rem' }}>
            <label><input type="checkbox" checked={shuffled} onChange={(e) => setShuffled(e.target.checked)} />Shuffle cards</label>
          </div>
          <table>
            <thead><tr><th>Chapter</th><th className="right">Cards</th><th></th></tr></thead>
            <tbody>
              {chapterNums.map((n) => (
                <tr key={n}>
                  <td className={counts[n] ? '' : 'muted'}>{chapterName(n)}</td>
                  <td className="right">{counts[n] || 0}</td>
                  <td className="right"><button className="btn sm" disabled={!counts[n]} onClick={() => start(n)}>Start</button></td>
                </tr>
              ))}
              {counts[NONE] > 0 && (
                <tr>
                  <td>No chapter</td>
                  <td className="right">{counts[NONE]}</td>
                  <td className="right"><button className="btn sm" onClick={() => start(NONE)}>Start</button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TypingSession({ label, cards, onRestart, onExit }) {
  const [i, setI] = useState(0)
  const [results, setResults] = useState([]) // { term, acc, wpm, wrong, skipped }

  if (i >= cards.length) {
    const done = results.filter((r) => !r.skipped)
    const avg = (f) => (done.length ? Math.round(done.reduce((s, r) => s + r[f], 0) / done.length) : 0)
    return (
      <div>
        <h2>Typing complete</h2>
        <div className="card">
          <p className="muted">{label}</p>
          <div className="typing-stats">
            <div className="stat"><div className="label">Cards typed</div><strong>{done.length} of {cards.length}</strong></div>
            <div className="stat"><div className="label">Average accuracy</div><strong>{avg('acc')}%</strong></div>
            <div className="stat"><div className="label">Average speed</div><strong>{avg('wpm')} WPM</strong></div>
          </div>
          <table style={{ marginTop: '0.75rem' }}>
            <thead><tr><th>Term</th><th className="right">Accuracy</th><th className="right">WPM</th><th className="right">Wrong letters</th></tr></thead>
            <tbody>
              {results.map((r, n) => (
                <tr key={n}>
                  <td><strong>{r.term}</strong></td>
                  {r.skipped
                    ? <td className="right muted" colSpan={3}>skipped</td>
                    : <><td className="right">{r.acc}%</td><td className="right">{r.wpm}</td><td className="right">{r.wrong}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button className="btn" onClick={onRestart}>Type this chapter again</button>
            <button className="btn secondary" onClick={onExit}>Choose another chapter</button>
          </div>
        </div>
      </div>
    )
  }

  const card = cards[i]
  const next = (result) => {
    setResults((r) => [...r, { term: card.term, ...result }])
    setI((n) => n + 1)
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span className="muted small">{label} · Card {i + 1} of {cards.length}</span>
        <button className="btn secondary sm" onClick={onExit}>Stop</button>
      </div>
      <div className="progressbar"><div style={{ width: `${(i / cards.length) * 100}%` }} /></div>
      <CardTyper key={card.id} target={targetOf(card)} onNext={next} />
    </div>
  )
}

function CardTyper({ target, onNext }) {
  const [typed, setTyped] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const t0 = useRef(null)
  const t1 = useRef(null)
  const keys = useRef({ total: 0, errors: 0 })
  const done = typed.length >= target.length

  useEffect(() => { inputRef.current?.focus() }, [])

  const stats = (() => {
    if (!done) return null
    const secs = Math.max((t1.current - t0.current) / 1000, 1)
    const { total, errors } = keys.current
    let wrong = 0
    for (let n = 0; n < target.length; n++) if (typed[n] !== target[n]) wrong++
    return {
      acc: total ? Math.round(((total - errors) / total) * 100) : 100,
      wpm: Math.round(target.length / 5 / (secs / 60)),
      wrong,
    }
  })()

  // Enter moves on after the card is finished.
  useEffect(() => {
    if (!done) return
    const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); onNext(stats) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onChange = (e) => {
    if (done) return
    const v = e.target.value.slice(0, target.length)
    for (let n = typed.length; n < v.length; n++) {
      keys.current.total++
      if (v[n] !== target[n]) keys.current.errors++
    }
    if (v.length > 0 && t0.current == null) t0.current = Date.now()
    if (v.length >= target.length) t1.current = Date.now()
    setTyped(v)
  }

  return (
    <div className="card" style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        className="typing-input"
        value={typed}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (BLOCKED_KEYS.includes(e.key)) e.preventDefault() }}
        autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
        aria-label="Type the card text"
      />
      <div className={`typing-text${focused ? ' focused' : ''}`} onClick={() => inputRef.current?.focus()}>
        {target.split('').map((ch, n) => {
          const cls = n < typed.length ? (typed[n] === ch ? 'tc-ok' : 'tc-bad') : n === typed.length ? 'tc-cur' : 'tc-todo'
          return <span key={n} className={cls}>{ch}</span>
        })}
      </div>
      {!done && !focused && <p className="muted small">Click the text to keep typing.</p>}
      {done ? (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="typing-stats">
            <div className="stat"><div className="label">Accuracy</div><strong>{stats.acc}%</strong></div>
            <div className="stat"><div className="label">Speed</div><strong>{stats.wpm} WPM</strong></div>
            <div className="stat"><div className="label">Wrong letters left</div><strong>{stats.wrong}</strong></div>
          </div>
          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button className="btn" onClick={() => onNext(stats)}>Next (Enter)</button>
          </div>
        </div>
      ) : (
        <div className="row" style={{ marginTop: '0.5rem', justifyContent: 'space-between' }}>
          <span className="muted small">Backspace fixes a letter. Pasting is off.</span>
          <button className="btn secondary sm" onClick={() => onNext({ skipped: true })}>Skip</button>
        </div>
      )}
    </div>
  )
}
