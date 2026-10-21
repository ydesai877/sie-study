import { useMemo, useState } from 'react'
import { shuffle } from '../lib/questions'
import data from '../data/journal.json'

const { accounts, transactions } = data
const TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']
const TOPICS = [...new Set(transactions.map((t) => t.topic))]
const ACCOUNT_NAMES = Object.keys(accounts).sort()

const cents = (n) => Math.round(n * 100) / 100
const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2 })
const parseAmount = (s) => {
  const n = Number(String(s).replace(/[$,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? cents(n) : 0
}
const sideLabel = (s) => (s === 'debit' ? 'Debit' : 'Credit')

// Sum amounts by "account|side", so two lines for the same account and side count as one.
function totals(lines) {
  const m = new Map()
  for (const l of lines) {
    if (!l.account || !(l.amount > 0)) continue
    const k = `${l.account}|${l.side}`
    m.set(k, cents((m.get(k) || 0) + l.amount))
  }
  return m
}

// Journal Entry practice (Accounting). Two modes:
//   pick  - choose Debit or Credit for each account of a given entry
//   build - choose the accounts, sides, and amounts yourself
// Results are not saved. Transactions live in src/data/journal.json.
export default function JournalEntry() {
  const [mode, setMode] = useState('pick')
  const [topic, setTopic] = useState('all')
  const [count, setCount] = useState(10)
  const [run, setRun] = useState(null) // { key, mode, items }

  const pool = useMemo(() => transactions.filter((t) => topic === 'all' || t.topic === topic), [topic])
  const n = Math.max(1, Math.min(count || 1, pool.length))
  const start = () => setRun({ key: Date.now(), mode, items: shuffle(pool).slice(0, n) })

  if (run) {
    return <Session key={run.key} mode={run.mode} items={run.items} onRestart={start} onExit={() => setRun(null)} />
  }

  return (
    <div>
      <h2>Journal Entry</h2>
      <p className="muted">Practice debits and credits. Debit is the left side of an entry. Credit is the right side. Total debits must equal total credits.</p>

      <div className="card">
        <h3>Mode</h3>
        <div className="checklist">
          <label><input type="radio" name="je-mode" checked={mode === 'pick'} onChange={() => setMode('pick')} />Pick the side: choose Debit or Credit for each account</label>
          <br />
          <label><input type="radio" name="je-mode" checked={mode === 'build'} onChange={() => setMode('build')} />Build the entry: choose the accounts, sides, and amounts</label>
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <label className="field"><span>Topic</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="all">All topics ({transactions.length})</option>
              {TOPICS.map((t) => <option key={t} value={t}>{t} ({transactions.filter((x) => x.topic === t).length})</option>)}
            </select>
          </label>
          <label className="field"><span>Number of transactions</span>
            <input type="number" min="1" max={pool.length} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
        </div>
        <div className="row">
          <button className="btn" onClick={start}>Start ({n} of {pool.length})</button>
        </div>
      </div>
    </div>
  )
}

function Session({ mode, items, onRestart, onExit }) {
  const [i, setI] = useState(0)
  const [results, setResults] = useState([]) // { tx, ok }

  if (i >= items.length) {
    const score = results.filter((r) => r.ok).length
    return (
      <div>
        <h2>Round complete</h2>
        <div className="card">
          <div className="stat"><div className="label">Score</div><strong>{score} of {results.length} correct</strong></div>
          <table style={{ marginTop: '0.75rem' }}>
            <thead><tr><th>Transaction</th><th className="right">Result</th></tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.tx.id}>
                  <td className="small">{r.tx.description}</td>
                  <td className="right">{r.ok ? 'Correct' : 'Missed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ marginTop: '0.75rem' }}>
            <button className="btn" onClick={onRestart}>Another round</button>
            <button className="btn secondary" onClick={onExit}>Change settings</button>
          </div>
        </div>
      </div>
    )
  }

  const tx = items[i]
  const Question = mode === 'pick' ? PickQuestion : BuildQuestion
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span className="muted small">Transaction {i + 1} of {items.length}</span>
        <button className="btn secondary sm" onClick={onExit}>Stop</button>
      </div>
      <div className="progressbar"><div style={{ width: `${(i / items.length) * 100}%` }} /></div>
      <Question
        key={tx.id}
        tx={tx}
        onDone={(ok) => {
          setResults((r) => [...r, { tx, ok }])
          setI((n) => n + 1)
        }}
      />
    </div>
  )
}

function Prompt({ tx }) {
  return (
    <>
      <div className="qmeta">{tx.topic}</div>
      <p style={{ fontSize: '1.05rem', marginTop: 0 }}>{tx.description}</p>
    </>
  )
}

function EntryTable({ lines }) {
  const sorted = [...lines].sort((a, b) => (a.side === b.side ? 0 : a.side === 'debit' ? -1 : 1))
  return (
    <table className="je-table" style={{ margin: '0.75rem 0' }}>
      <thead><tr><th>Correct entry</th><th className="right">Debit</th><th className="right">Credit</th></tr></thead>
      <tbody>
        {sorted.map((l, n) => (
          <tr key={n}>
            <td className={l.side === 'credit' ? 'cr' : ''}>{l.account}</td>
            <td className="num right">{l.side === 'debit' ? money(l.amount) : ''}</td>
            <td className="num right">{l.side === 'credit' ? money(l.amount) : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Feedback({ tx, ok, note, onNext }) {
  return (
    <div>
      <div className={`explain ${ok ? 'good' : 'bad'}`}><strong>{ok ? 'Correct.' : 'Not quite.'}</strong> {note}</div>
      <EntryTable lines={tx.lines} />
      <p className="small">{tx.explanation}</p>
      <div className="row"><button className="btn" onClick={onNext} autoFocus>Next</button></div>
    </div>
  )
}

// Pick mode: the accounts and amounts are given. Choose the side of each.
function PickQuestion({ tx, onDone }) {
  const order = useMemo(() => shuffle(tx.lines), [tx])
  const [picks, setPicks] = useState(() => order.map(() => null))
  const [checked, setChecked] = useState(false)
  const right = order.map((l, n) => picks[n] === l.side)
  const ok = right.every(Boolean)

  return (
    <div className="card">
      <Prompt tx={tx} />
      {order.map((l, n) => (
        <div key={n} className={`je-row${checked ? (right[n] ? ' ok' : ' bad') : ''}`}>
          <span className="je-acct">{l.account}</span>
          <span className="je-amt">{money(l.amount)}</span>
          <span className="row" style={{ gap: '0.4rem' }}>
            {['debit', 'credit'].map((s) => (
              <button
                key={s}
                type="button"
                className={`btn sm${picks[n] === s ? '' : ' secondary'}`}
                aria-pressed={picks[n] === s}
                disabled={checked}
                onClick={() => setPicks((p) => p.map((x, j) => (j === n ? s : x)))}
              >
                {sideLabel(s)}
              </button>
            ))}
          </span>
          {checked && !right[n] && <span className="small">Correct side: {sideLabel(l.side)}</span>}
        </div>
      ))}
      {checked ? (
        <Feedback tx={tx} ok={ok} note={ok ? 'Every side is right.' : 'Check the rows marked in red.'} onNext={() => onDone(ok)} />
      ) : (
        <div className="row"><button className="btn" disabled={picks.some((p) => p == null)} onClick={() => setChecked(true)}>Check</button></div>
      )}
    </div>
  )
}

const blankRow = (side) => ({ account: '', side, amount: '' })

// Build mode: choose the accounts, sides, and amounts. Line order does not matter.
function BuildQuestion({ tx, onDone }) {
  const [rows, setRows] = useState([blankRow('debit'), blankRow('credit')])
  const [checked, setChecked] = useState(false)

  const update = (n, patch) => setRows((rs) => rs.map((r, j) => (j === n ? { ...r, ...patch } : r)))
  const filled = rows.filter((r) => r.account && parseAmount(r.amount) > 0)
  const mine = totals(filled.map((r) => ({ ...r, amount: parseAmount(r.amount) })))
  const answer = totals(tx.lines)
  const ok = mine.size === answer.size && [...answer].every(([k, v]) => mine.get(k) === v)
  const rowOk = (r) => {
    const k = `${r.account}|${r.side}`
    return answer.has(k) && mine.get(k) === answer.get(k)
  }
  const sum = (side) => cents(filled.filter((r) => r.side === side).reduce((s, r) => s + parseAmount(r.amount), 0))
  const unbalanced = sum('debit') !== sum('credit')
  const note = ok
    ? 'Accounts, sides, and amounts all match.'
    : unbalanced
      ? `Your debits (${money(sum('debit'))}) do not equal your credits (${money(sum('credit'))}).`
      : 'Compare your lines with the correct entry below.'

  return (
    <div className="card">
      <Prompt tx={tx} />
      {rows.map((r, n) => (
        <div key={n} className={`je-row je-build${checked && filled.includes(r) ? (rowOk(r) ? ' ok' : ' bad') : ''}`}>
          <select aria-label={`Account ${n + 1}`} value={r.account} disabled={checked} onChange={(e) => update(n, { account: e.target.value })}>
            <option value="">Choose account...</option>
            {TYPES.map((t) => (
              <optgroup key={t} label={t}>
                {ACCOUNT_NAMES.filter((a) => accounts[a] === t).map((a) => <option key={a} value={a}>{a}</option>)}
              </optgroup>
            ))}
          </select>
          <select aria-label={`Side ${n + 1}`} value={r.side} disabled={checked} onChange={(e) => update(n, { side: e.target.value })}>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Amount ${n + 1}`}
            placeholder="Amount"
            value={r.amount}
            disabled={checked}
            onChange={(e) => update(n, { amount: e.target.value })}
          />
          {!checked && rows.length > 2 && (
            <button type="button" className="btn secondary sm" onClick={() => setRows((rs) => rs.filter((_, j) => j !== n))}>Remove</button>
          )}
        </div>
      ))}
      {checked ? (
        <Feedback tx={tx} ok={ok} note={note} onNext={() => onDone(ok)} />
      ) : (
        <div className="row">
          {rows.length < 6 && <button type="button" className="btn secondary sm" onClick={() => setRows((rs) => [...rs, blankRow('debit')])}>Add line</button>}
          <button className="btn" disabled={filled.length < 2} onClick={() => setChecked(true)}>Check</button>
        </div>
      )}
    </div>
  )
}
