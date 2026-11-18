import { describe, expect, it } from 'vitest'
import { THINGS, equivalence, roundCount } from './equivalences'

describe('equivalence', () => {
  it('tria la cosa més pesant que hi cap', () => {
    const e = equivalence(24_000)
    expect(e?.thing.many).toBe('autobusos')
    expect(e?.count).toBe(2)
  })
  it('20 tones (dos dies de gimnàs) → 1,7 autobusos', () => {
    const e = equivalence(20_000)
    expect(e?.thing.many).toBe('autobusos')
    expect(roundCount(e!.count)).toBe(1.7)
  })
  it('el pes exacte compta com a sencer', () => {
    const e = equivalence(7_300_000)
    expect(e?.thing.one).toBe('la Torre Eiffel')
    expect(e?.count).toBe(1)
  })
  it('per sobre de la més pesant, en compta quantes', () => {
    const e = equivalence(12_000_000_000)
    expect(e?.thing.one).toBe('la Gran Piràmide de Guiza')
    expect(e?.count).toBe(2)
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
  it('la llista està ordenada de menys a més, sense pesos repetits', () => {
    for (let i = 1; i < THINGS.length; i++) expect(THINGS[i].kg).toBeGreaterThan(THINGS[i - 1].kg)
  })
  it('on hi ha l\'entrenament real (100 kg – 10.000 t), cap salt més gran de ×3,2', () => {
    for (let i = 1; i < THINGS.length; i++) {
      if (THINGS[i - 1].kg >= 100 && THINGS[i].kg <= 10_000_000) {
        expect(THINGS[i].kg / THINGS[i - 1].kg).toBeLessThanOrEqual(3.2)
      }
    }
  })
})

describe('roundCount', () => {
  it('un decimal per sota de 10, sencer per sobre', () => {
    expect(roundCount(2.345)).toBe(2.3)
    expect(roundCount(12.6)).toBe(13)
  })
})
