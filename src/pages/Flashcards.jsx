import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { SEED_CARDS, shuffle } from '../lib/questions'
import { addCard, updateCard, deleteCard, gradeCard } from '../lib/actions'
import { CHAPTERS, chapterName } from '../data/chapters'
import Flashcard from '../components/Flashcard'

const blank = { term: '', definition: '', chapter: '' }

// Quizlet-style deck: add, edit, delete, bulk import, and study.
export default function Flashcards() {
  const state = useStore()
  const all = useMemo(() => [...SEED_CARDS, ...state.cards], [state.cards])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null) // card id
  const [filter, setFilter] = useState('')
  const [bulk, setBulk] = useState('')
  const [study, setStudy] = useState(null) // { ids, i }

  const visible = all.filter((c) => {
    const f = filter.toLowerCase()
    return !f || c.term.toLowerCase().includes(f) || c.definition.toLowerCase().includes(f) || String(c.chapter).includes(f)
  })

  const submit = (e) => {
    e.preventDefault()
    if (!form.term.trim() || !form.definition.trim()) return
    const card = { term: form.term.trim(), definition: form.definition.trim(), chapter: form.chapter ? Number(form.chapter) : undefined }
    if (editing) {
      updateCard(editing, card)
      setEditing(null)
    } else addCard(card)
    setForm(blank)
  }

  const startEdit = (c) => {
    setEditing(c.id)
    setForm({ term: c.term, definition: c.definition, chapter: c.chapter ?? '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Quizlet export format: "term<TAB>definition" per line. Also accepts "term - definition" or "term: definition".
  const importBulk = () => {
    let n = 0
    for (const line of bulk.split('\n')) {
      const m = line.match(/^(.+?)(?:\t| - |: )(.+)$/)
      if (m) {
        addCard({ term: m[1].trim(), definition: m[2].trim() })
        n++
      }
    }
    setBulk('')
    alert(`${n} cards added`)
  }

  if (study) {
    const { ids, i } = study
    if (i >= ids.length) {
      return (
        <div>
          <h1>Deck complete</h1>
          <div className="card">
            <p>{ids.length} cards reviewed. Cards you marked Again are queued in Daily Review.</p>
            <button className="btn" onClick={() => setStudy(null)}>Back to deck</button>
          </div>
        </div>
      )
    }
    const card = all.find((c) => c.id === ids[i])
    return (
      <div>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span className="muted small">Card {i + 1} of {ids.length}</span>
          <button className="btn secondary sm" onClick={() => setStudy(null)}>Stop</button>
        </div>
        <Flashcard
          key={card.id}
          card={card}
          onGrade={(quality) => {
            gradeCard(card.id, quality)
            setStudy((s) => ({ ...s, i: s.i + 1 }))
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <h1>Flashcards</h1>
      <p className="muted">{all.length} cards. Cards you add are saved in this browser; back them up from Settings.</p>

      <div className="card">
        <h3>{editing ? 'Edit card' : 'Add a card'}</h3>
        <form onSubmit={submit}>
          <div className="grid">
            <label className="field"><span>Term</span>
              <input type="text" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="e.g. Breakpoint" />
            </label>
            <label className="field"><span>Chapter (optional)</span>
              <select value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })}>
                <option value="">None</option>
                {CHAPTERS.map((c) => <option key={c.n} value={c.n}>{chapterName(c.n)}</option>)}
              </select>
            </label>
          </div>
          <label className="field"><span>Definition</span>
            <textarea value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} placeholder="Dollar level at which a mutual fund reduces its sales charge" />
          </label>
          <div className="row">
            <button className="btn" type="submit">{editing ? 'Save' : 'Add card'}</button>
            {editing && <button className="btn secondary" type="button" onClick={() => { setEditing(null); setForm(blank) }}>Cancel</button>}
          </div>
        </form>
        <details style={{ marginTop: '0.75rem' }}>
          <summary>Bulk import</summary>
          <p className="muted small">One card per line: <code>term [tab] definition</code>, <code>term - definition</code>, or <code>term: definition</code>. This matches Quizlet's export.</p>
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} />
          <button className="btn secondary sm" style={{ marginTop: '0.5rem' }} onClick={importBulk} disabled={!bulk.trim()}>Import</button>
        </details>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <input type="text" style={{ maxWidth: 280 }} placeholder="Search cards" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="row">
            <button className="btn" disabled={!visible.length} onClick={() => setStudy({ ids: shuffle(visible.map((c) => c.id)), i: 0 })}>
              Study {filter ? 'these' : 'all'} ({visible.length})
            </button>
          </div>
        </div>
        <table style={{ marginTop: '0.75rem' }}>
          <thead><tr><th>Term</th><th>Definition</th><th>Chapter</th><th></th></tr></thead>
          <tbody>
            {visible.map((c) => {
              const seed = c.id.startsWith('seed-')
              return (
                <tr key={c.id}>
                  <td><strong>{c.term}</strong></td>
                  <td className="small">{c.definition}</td>
                  <td className="small muted">{c.chapter ?? ''}</td>
                  <td className="right" style={{ whiteSpace: 'nowrap' }}>
                    {!seed && <button className="btn secondary sm" onClick={() => startEdit(c)}>Edit</button>}{' '}
                    {!seed && <button className="btn secondary sm" onClick={() => { if (confirm('Delete this card?')) deleteCard(c.id) }}>Delete</button>}
                    {seed && <span className="muted small">seed</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
