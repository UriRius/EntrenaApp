// Descarrega el catàleg gratuït d'ExerciseDB (1.500 exercicis) a assets/catalog.json.
// Només cal tornar-lo a executar si es vol actualitzar el catàleg:
//   node scripts/fetch-catalog.mjs
// Els GIF NO es descarreguen aquí: l'app els baixa sota demanda.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://oss.exercisedb.dev/api/v1/exercises'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'catalog.json')
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function page(after) {
  const url = `${BASE}?limit=25${after ? `&after=${after}` : ''}`
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    console.warn(`HTTP ${res.status} (intent ${attempt}) ${url}`)
    await sleep(2000 * attempt)
  }
  throw new Error(`No s'ha pogut llegir ${url}`)
}

const all = []
let after
do {
  const body = await page(after)
  all.push(...body.data)
  after = body.meta.hasNextPage ? body.meta.nextCursor : undefined
  process.stdout.write(`\r${all.length}/${body.meta.total}`)
  await sleep(250)
} while (after)

const catalog = all
  .map(e => ({
    id: e.exerciseId,
    name: e.name,
    gifUrl: e.gifUrl,
    bodyParts: e.bodyParts,
    equipments: e.equipments,
    targetMuscles: e.targetMuscles,
    secondaryMuscles: e.secondaryMuscles,
    instructions: e.instructions.map(s => s.replace(/^Step:\s*\d+\s*/i, '')),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const ids = new Set(catalog.map(e => e.id))
if (ids.size !== catalog.length) throw new Error('IDs duplicats al catàleg')

writeFileSync(OUT, JSON.stringify(catalog))
console.log(`\n${catalog.length} exercicis → ${OUT}`)
