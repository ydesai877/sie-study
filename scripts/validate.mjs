// Validates every question file and the seed flashcards.
// Run: node scripts/validate.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const TYPES = new Set(['chapter', 'mastery', 'final', 'random_final', 'quick_quiz'])
const dir = 'src/data/questions'
const ids = new Set()
let errors = 0
let count = 0

const fail = (file, msg) => {
  errors++
  console.error(`${file}: ${msg}`)
}

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  let data
  try {
    data = JSON.parse(readFileSync(join(dir, file), 'utf8'))
  } catch (e) {
    fail(file, `invalid JSON: ${e.message}`)
    continue
  }
  if (!Array.isArray(data)) {
    fail(file, 'top level must be an array')
    continue
  }
  data.forEach((q, i) => {
    const where = `${file}[${i}] (${q.id ?? 'no id'})`
    if (!q.id) fail(where, 'missing id')
    else if (ids.has(q.id)) fail(where, `duplicate id ${q.id}`)
    else ids.add(q.id)
    if (!q.source || !TYPES.has(q.source.type)) fail(where, 'source.type must be one of ' + [...TYPES].join(', '))
    if (!Number.isInteger(q.chapter) || q.chapter < 1) fail(where, 'chapter must be a positive integer')
    if (typeof q.question !== 'string' || !q.question.trim()) fail(where, 'question text missing')
    if (!Array.isArray(q.choices) || q.choices.length < 2) fail(where, 'choices needs at least 2 entries')
    else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length)
      fail(where, `answer must be an index 0..${q.choices.length - 1}`)
    if (q.exhibit != null && typeof q.exhibit !== 'string') fail(where, 'exhibit must be a string')
    if (!q.explanation) console.warn(`warn ${where}: no explanation`)
    count++
  })
}

const cards = JSON.parse(readFileSync('src/data/flashcards.json', 'utf8'))
const cardIds = new Set()
cards.forEach((c, i) => {
  const where = `flashcards.json[${i}]`
  if (!c.id || cardIds.has(c.id)) fail(where, 'missing or duplicate id')
  cardIds.add(c.id)
  if (!c.term || !c.definition) fail(where, 'term and definition are required')
})

console.log(`${count} questions, ${cards.length} seed flashcards, ${errors} errors`)
process.exit(errors ? 1 : 0)
