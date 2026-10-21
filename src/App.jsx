import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import { idsFor } from './lib/subjects'
import { dueQueue } from './lib/srs'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import AccountingDashboard from './pages/AccountingDashboard'
import PracticeMode from './pages/PracticeMode'
import Review from './pages/Review'
import MockExam from './pages/MockExam'
import Exams from './pages/Exams'
import Settings from './pages/Settings'

const SIE_PAGES = [
  ['dashboard', 'Dashboard'],
  ['review', 'Daily Review'],
  ['exams', 'Exams'],
  ['practice', 'Practice mode'],
  ['exam', 'Mock Exam'],
  ['settings', 'Settings'],
]

// Accounting pages live under #/acc/. SIE keeps its old links (#/dashboard, #/practice?...).
const ACC_PAGES = [
  ['acc/dashboard', 'Dashboard'],
  ['acc/review', 'Daily Review'],
  ['acc/practice', 'Practice mode'],
]

function useHash() {
  const read = () => location.hash.replace(/^#\/?/, '') || 'home'
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

  if (page === 'home') return <Home />

  const accounting = page.startsWith('acc/')
  const subject = accounting ? 'accounting' : 'sie'
  const due = dueQueue(idsFor(subject, state.cards), state.srs).length

  const views = accounting
    ? {
        'acc/dashboard': <AccountingDashboard />,
        'acc/review': <Review subject="accounting" />,
        'acc/practice': <PracticeMode subject="accounting" key={hash} query={query} />,
      }
    : {
        dashboard: <Dashboard />,
        review: <Review />,
        practice: <PracticeMode key={hash} query={query} />,
        exams: <Exams query={query} />,
        flashcards: <PracticeMode key={hash} initialTab="flashcards" />, // old #/flashcards links
        exam: <MockExam />,
        settings: <Settings />,
      }
  const view = views[page] ?? (accounting ? <AccountingDashboard /> : <Dashboard />)
  const pages = accounting ? ACC_PAGES : SIE_PAGES

  return (
    <div className="shell">
      <nav className="nav">
        <div className="brand">{accounting ? 'Accounting' : 'SIE Study'}</div>
        <a href="#/home" className="switch">← Switch subject</a>
        {pages.map(([key, label]) => (
          <a key={key} href={`#/${key}`} className={page === key || (key === 'practice' && page === 'flashcards') ? 'active' : ''}>
            {label}
            {key.endsWith('review') && due > 0 && <span className="badge">{due}</span>}
          </a>
        ))}
      </nav>
      <main className="main">{view}</main>
    </div>
  )
}
