import { useEffect, useState } from 'react'
import { chapterName } from '../data/chapters'

// Flip card with self-grading. Space flips, 1-4 grade. Parents pass key={card.id}.
export default function Flashcard({ card, onGrade }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) onGrade([1, 3, 4, 5][Number(e.key) - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipped, onGrade])

  if (!card) return null
  return (
    <div>
      <div className="qmeta">Flashcard{card.chapter ? ` · ${chapterName(card.chapter)}` : ''}</div>
      <div className="card flashcard-wrap">
        <div className="flashcard" onClick={() => setFlipped((f) => !f)}>
          {flipped ? card.definition : card.term}
        </div>
        <span className="hint">{flipped ? 'definition' : 'term · click or space to flip'}</span>
      </div>
      {flipped ? (
        <div className="row">
          <button className="btn danger" onClick={() => onGrade(1)}>Again (1)</button>
          <button className="btn secondary" onClick={() => onGrade(3)}>Hard (2)</button>
          <button className="btn" onClick={() => onGrade(4)}>Good (3)</button>
          <button className="btn secondary" onClick={() => onGrade(5)}>Easy (4)</button>
        </div>
      ) : (
        <button className="btn" onClick={() => setFlipped(true)}>Show answer</button>
      )}
    </div>
  )
}
