import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import { QUESTIONS, SEED_CARDS } from './lib/questions'
import { dueQueue } from './lib/srs'
import Dashboard from './pages/Dashboard'
import PracticeMode from './pages/PracticeMode'
import Review from './pages/Review'
import MockExam from './pages/MockExam'
import Exams from './pages/Exams'
import Settings from './pages/Settings'

const PAGES = [
  ['dashboard', 'Dashboard'],
  ['review', 'Daily Review'],
  ['exams', 'Exams'],
  ['practice', 'Practice mode'],
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
    practice: <PracticeMode key={hash} query={query} />,
    exams: <Exams query={query} />,
    flashcards: <PracticeMode key={hash} initialTab="flashcards" />, // old #/flashcards links
    exam: <MockExam />,
    settings: <Settings />,
  }[page] ?? <Dashboard />

  return (
    <div className="shell">
      <nav className="nav">
        <div className="brand">SIE Study</div>
        {PAGES.map(([key, label]) => (
          <a key={key} href={`#/${key}`} className={page === key || (key === 'practice' && page === 'flashcards') ? 'active' : ''}>
            {label}
            {key === 'review' && due > 0 && <span className="badge">{due}</span>}
          </a>
        ))}
      </nav>
      <main className="main">{view}</main>
    </div>
  )
}
