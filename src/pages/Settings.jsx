import { useState } from 'react'
import { useStore, setState, exportJSON, importJSON, resetAll } from '../lib/store'
import { QUESTIONS, SOURCES } from '../lib/questions'

export default function Settings() {
  const state = useStore()
  const [msg, setMsg] = useState('')

  const download = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sie-study-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const upload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((t) => {
      try {
        importJSON(t)
        setMsg('Backup restored.')
      } catch (err) {
        setMsg(`Import failed: ${err.message}`)
      }
    })
    e.target.value = ''
  }

  return (
    <div>
      <h1>Settings</h1>

      <div className="card">
        <h3>Daily review</h3>
        <label className="field"><span>New items to add each day</span>
          <input type="number" min="0" max="200" style={{ maxWidth: 120 }} value={state.settings.dailyNew ?? 20}
            onChange={(e) => setState((s) => ({ ...s, settings: { ...s.settings, dailyNew: Number(e.target.value) } }))} />
        </label>
      </div>

      <div className="card">
        <h3>Backup</h3>
        <p className="muted small">Progress and your own flashcards live in this browser only. Export before switching devices or clearing browser data.</p>
        <div className="row">
          <button className="btn" onClick={download}>Export backup</button>
          <label className="btn secondary" style={{ cursor: 'pointer' }}>
            Import backup
            <input type="file" accept="application/json" style={{ display: 'none' }} onChange={upload} />
          </label>
        </div>
        {msg && <p className="small" style={{ marginTop: '0.5rem' }}>{msg}</p>}
      </div>

      <div className="card">
        <h3>Question bank</h3>
        <p className="small">{QUESTIONS.length} questions across {SOURCES.length} source(s): {SOURCES.join(', ')}</p>
        <p className="muted small">Add questions as JSON files in <code>src/data/questions/</code>. See <code>src/data/README.md</code> for the format.</p>
      </div>

      <div className="card">
        <h3>Reset</h3>
        <p className="muted small">Deletes all attempts, schedules, exams, and your own flashcards. Export first.</p>
        <button className="btn danger" onClick={() => { if (confirm('Delete all progress? This cannot be undone.')) { resetAll(); setMsg('Progress reset.') } }}>Reset all progress</button>
      </div>
    </div>
  )
}
