import { useState } from 'react'
import Practice from './Practice'
import Flashcards from './Flashcards'
import Typing from './Typing'

const TABS = [
  ['questions', 'Practice Questions'],
  ['flashcards', 'Flashcards'],
  ['typing', 'Typing'],
]

// Practice mode: one page with three ways to practice.
// #/practice?tab=typing opens a tab directly. Other query keys (chapter, focus)
// pass through to Practice Questions, so Dashboard links still work.
export default function PracticeMode({ query, initialTab }) {
  const wanted = new URLSearchParams(query || '').get('tab') || initialTab
  const [tab, setTab] = useState(TABS.some(([k]) => k === wanted) ? wanted : 'questions')

  return (
    <div>
      <h1>Practice mode</h1>
      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'questions' && <Practice query={query} />}
      {tab === 'flashcards' && <Flashcards />}
      {tab === 'typing' && <Typing />}
    </div>
  )
}
