import { useEffect, useMemo, useState } from 'react'
import { shuffleChoices, sourceLabel } from '../lib/questions'
import { chapterName } from '../data/chapters'

const LETTERS = 'ABCDEFGH'

// One multiple-choice question. Parents pass key={q.id} so state resets per question.
// mode 'practice': reveal answer + explanation on submit, then Next.
// mode 'exam': no feedback, just record the pick and move on.
export default function QuestionCard({ q, index, total, mode = 'practice', onAnswer, onNext, initialPick = null, salt }) {
  const [sessionSalt] = useState(() => salt ?? String(Date.now()))
  const view = useMemo(() => shuffleChoices(q, sessionSalt), [q, sessionSalt])
  const [pick, setPick] = useState(initialPick)
  const [submitted, setSubmitted] = useState(false)

  const choose = (i) => {
    setPick(i)
    if (mode === 'exam') onAnswer?.(i === view.answer, i)
  }

  const submit = () => {
    setSubmitted(true)
    onAnswer?.(pick === view.answer, pick)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const i = LETTERS.indexOf(e.key.toUpperCase())
      if (i >= 0 && i < view.choices.length && !submitted) choose(i)
      if (e.key === 'Enter') {
        if (mode === 'practice' && !submitted && pick != null) submit()
        else if (submitted || mode === 'exam') onNext?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const correct = pick === view.answer
  const showFeedback = mode === 'practice' && submitted

  return (
    <div className="card">
      <div className="qmeta">
        {index != null && total != null && <span>Question {index + 1} of {total} · </span>}
        {chapterName(q.chapter)}
        {q.section ? ` · ${q.section}` : ''}
        {q.topic ? ` · ${q.topic}` : ''}
        {' · '}
        <span>{sourceLabel(q)}</span>
      </div>
      {q.exhibit && <div className={`exhibit${q.exhibitMono ? ' mono' : ''}`}>{q.exhibit}</div>}
      <div className="question-text">{q.question}</div>
      {view.choices.map((c, i) => {
        let cls = 'choice'
        if (showFeedback) {
          if (i === view.answer) cls += ' correct'
          else if (i === pick) cls += ' wrong'
        } else if (i === pick) cls += ' selected'
        return (
          <button key={i} className={cls} disabled={showFeedback} onClick={() => choose(i)}>
            <span className="letter">{LETTERS[i]}</span>
            {c}
          </button>
        )
      })}
      {showFeedback && (
        <div className={`explain ${correct ? 'good' : 'bad'}`}>
          <strong>{correct ? 'Correct.' : `Incorrect. The answer is ${LETTERS[view.answer]}.`}</strong>
          {q.explanation && <p style={{ marginTop: '0.4rem', marginBottom: 0, whiteSpace: 'pre-wrap' }}>{q.explanation}</p>}
        </div>
      )}
      <div className="row" style={{ marginTop: '1rem', justifyContent: 'space-between' }}>
        <span className="muted small">Keys: A-D to pick, Enter to {mode === 'practice' && !submitted ? 'check' : 'continue'}</span>
        {mode === 'practice' && !submitted && (
          <button className="btn" disabled={pick == null} onClick={submit}>Check</button>
        )}
        {(showFeedback || mode === 'exam') && (
          <button className="btn" onClick={onNext}>{total != null && index + 1 === total ? 'Finish' : 'Next'}</button>
        )}
      </div>
    </div>
  )
}
