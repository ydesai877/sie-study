import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import { QUESTIONS, SEED_CARDS } from './lib/questions'
import { dueQueue } from './lib/srs'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import Review from './pages/Review'
import Flashcards from './pages/Flashcards'
import MockExam from './pages/MockExam'
import Exams from './pages/Exams'
import Settings from './pages/Settings'

const PAGES = [
  ['dashboard', 'Dashboard'],
  ['review', 'Daily Review'],
  ['practice', 'Practice'],
  ['exams', 'Exams'],
  ['flashcards', 'Flashcards'],
  ['exam', 'Mock Exam'],
  ['settings', 'Settings'],
]

function useHash() {
  const read = () => location.hash.replace(/^#\/?/, '') || 'dashboard'
  const [hash, setHash] = useState(read)
  useEffect(() => {
    const on = () => setHash(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const [page, query] = hash.split('?')
  const state = useStore()

  const allIds = [...QUESTIONS.map((q) => q.id), ...SEED_CARDS.map((c) => c.id), ...state.cards.map((c) => c.id)]
  const due = dueQueue(allIds, state.srs).length

  const view = {
    dashboard: <Dashboard />,
    review: <Review />,
    practice: <Practice query={query} />,
    exams: <Exams query={query} />,
    flashcards: <Flashcards />,
    exam: <MockExam />,
    settings: <Settings />,
  }[page] ?? <Dashboard />

  return (
    <div className="shell">
      <nav className="nav">
        <div className="brand">SIE Study</div>
        {PAGES.map(([key, label]) => (
          <a key={key} href={`#/${key}`} className={page === key ? 'active' : ''}>
            {label}
            {key === 'review' && due > 0 && <span className="badge">{due}</span>}
          </a>
        ))}
      </nav>
      <main className="main">{view}</main>
    </div>
  )
}
