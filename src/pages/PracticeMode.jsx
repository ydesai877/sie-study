import { useState } from 'react'
import Practice from './Practice'
import Flashcards from './Flashcards'
import Typing from './Typing'

const TABS = {
  sie: [
    ['questions', 'Practice Questions'],
    ['flashcards', 'Flashcards'],
    ['typing', 'Typing'],
  ],
  accounting: [
    ['flashcards', 'Flashcards'],
    ['typing', 'Typing'],
  ],
}

// Practice mode: one page with several ways to practice. SIE has three tabs. Accounting has two
// (it has no practice questions). #/practice?tab=typing opens a tab directly. Other query keys
// (chapter, focus) pass through to Practice Questions, so Dashboard links still work.
export default function PracticeMode({ query, initialTab, subject = 'sie' }) {
  const tabs = TABS[subject]
  const wanted = new URLSearchParams(query || '').get('tab') || initialTab
  const [tab, setTab] = useState(tabs.some(([k]) => k === wanted) ? wanted : tabs[0][0])

  return (
    <div>
      <h1>Practice mode</h1>
      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'questions' && <Practice query={query} />}
      {tab === 'flashcards' && <Flashcards subject={subject} />}
      {tab === 'typing' && <Typing subject={subject} />}
    </div>
  )
}
