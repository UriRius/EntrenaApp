import { describe, expect, it } from 'vitest'
import { THINGS, equivalence, roundCount } from './equivalences'

describe('equivalence', () => {
  it('tria la cosa més pesant que hi cap', () => {
    const e = equivalence(1000)
    expect(e?.thing.one).toBe('un cavall')
    expect(e?.count).toBe(2)
  })
  it('a partir de 1.200 kg, cotxes', () => {
    expect(equivalence(1500)?.thing.many).toBe('cotxes')
  })
  it('total petit → fracció de la cosa més lleugera', () => {
    const e = equivalence(2)
    expect(e?.thing.kg).toBe(4)
    expect(e?.count).toBe(0.5)
  })
  it('zero o negatiu → cap comparació', () => {
    expect(equivalence(0)).toBeNull()
    expect(equivalence(-10)).toBeNull()
  })
  it('la llista està ordenada de menys a més', () => {
    for (let i = 1; i < THINGS.length; i++) expect(THINGS[i].kg).toBeGreaterThan(THINGS[i - 1].kg)
  })
})

describe('roundCount', () => {
  it('un decimal per sota de 10, sencer per sobre', () => {
    expect(roundCount(2.345)).toBe(2.3)
    expect(roundCount(12.6)).toBe(13)
  })
})
