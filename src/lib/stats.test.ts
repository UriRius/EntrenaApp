import { describe, expect, it } from 'vitest'
import {
  effectiveWeight,
  estimatedOneRepMax,
  periodStart,
  progressMetric,
  progressSeries,
  records,
  suggestion,
  volume,
  type SetRow,
} from './stats'

const row = (over: Partial<SetRow>): SetRow => ({
  sessionId: 1,
  startedAt: 1000,
  exerciseId: 'bench',
  weightKg: 60,
  reps: 10,
  bodyweightKg: 80,
  isBodyweight: false,
  ...over,
})

describe('volume', () => {
  it('suma pes × reps i ignora les sèries buides', () => {
    const v = volume([row({}), row({ weightKg: 70, reps: 5 }), row({ reps: null }), row({ reps: 0 })])
    expect(v.totalKg).toBe(600 + 350)
    expect(v.sets).toBe(2)
    expect(v.reps).toBe(15)
    expect(v.sessions).toBe(1)
  })

  it('en pes corporal suma el pes corporal de la sessió + el llast', () => {
    const v = volume([row({ isBodyweight: true, weightKg: null, reps: 10 }), row({ isBodyweight: true, weightKg: 10, reps: 5 })])
    expect(v.totalKg).toBe(80 * 10 + 90 * 5)
    expect(v.setsMissingBodyweight).toBe(0)
  })

  it('avisa quan falta el pes corporal i no se l\'inventa', () => {
    const v = volume([row({ isBodyweight: true, bodyweightKg: null, weightKg: 5, reps: 10 })])
    expect(v.totalKg).toBe(50)
    expect(v.setsMissingBodyweight).toBe(1)
  })

  it('compta sessions diferents', () => {
    expect(volume([row({ sessionId: 1 }), row({ sessionId: 2 }), row({ sessionId: 2 })]).sessions).toBe(2)
  })
})

describe('effectiveWeight', () => {
  it('no suma el pes corporal en exercicis amb pes', () => {
    expect(effectiveWeight(row({ weightKg: 40 }))).toBe(40)
  })
})

describe('estimatedOneRepMax', () => {
  it('Epley', () => {
    expect(estimatedOneRepMax(100, 10)).toBeCloseTo(133.33, 1)
    expect(estimatedOneRepMax(100, 1)).toBe(100)
  })
  it('no estima fora de 1–12 reps ni sense pes', () => {
    expect(estimatedOneRepMax(100, 15)).toBeNull()
    expect(estimatedOneRepMax(0, 5)).toBeNull()
  })
})

describe('records', () => {
  it('troba la sèrie més pesada (empat → més reps)', () => {
    const r = records([row({ weightKg: 80, reps: 3, startedAt: 1 }), row({ weightKg: 80, reps: 5, startedAt: 2 }), row({ weightKg: 70, reps: 12 })])
    expect(r.best).toEqual({ weightKg: 80, reps: 5, at: 2 })
    expect(r.maxReps?.reps).toBe(12)
    expect(r.bestOneRepMax?.valueKg).toBeCloseTo(98, 0) // 70 × 1,4
  })
  it('sense sèries comptades no hi ha rècords', () => {
    expect(records([row({ reps: null })])).toEqual({ best: null, bestOneRepMax: null, maxReps: null })
  })
  it('no calcula 1RM en pes corporal', () => {
    expect(records([row({ isBodyweight: true, weightKg: 20, reps: 5 })]).bestOneRepMax).toBeNull()
  })
})

describe('progressSeries', () => {
  it('un punt per sessió amb el màxim, ordenat, sense zeros inventats', () => {
    const s = progressSeries(
      [
        row({ sessionId: 2, startedAt: 200, weightKg: 65 }),
        row({ sessionId: 1, startedAt: 100, weightKg: 60 }),
        row({ sessionId: 1, startedAt: 100, weightKg: 62.5 }),
        row({ sessionId: 3, startedAt: 300, reps: null }),
      ],
      'weight',
    )
    expect(s).toEqual([
      { at: 100, value: 62.5 },
      { at: 200, value: 65 },
    ])
  })
  it('mètrica de reps', () => {
    expect(progressSeries([row({ reps: 8 }), row({ reps: 12 })], 'reps')).toEqual([{ at: 1000, value: 12 }])
  })
})

describe('progressMetric', () => {
  it('pes corporal sense llast → reps; amb llast → pes', () => {
    expect(progressMetric([row({ isBodyweight: true, weightKg: null })], true)).toBe('reps')
    expect(progressMetric([row({ isBodyweight: true, weightKg: 10 })], true)).toBe('weight')
    expect(progressMetric([row({})], false)).toBe('weight')
  })
})

describe('periodStart', () => {
  const now = new Date(2026, 10, 9, 18, 30).getTime()
  it('mes i any en hora local', () => {
    expect(periodStart('month', now)).toBe(new Date(2026, 10, 1).getTime())
    expect(periodStart('year', now)).toBe(new Date(2026, 0, 1).getTime())
    expect(periodStart('all', now)).toBe(0)
  })
})

describe('suggestion', () => {
  const last = [
    { weightKg: 60, reps: 10 },
    { weightKg: 65, reps: 8 },
  ]
  it('la mateixa sèrie de l\'última vegada', () => {
    expect(suggestion(1, last, [])).toEqual({ weightKg: 65, reps: 8 })
  })
  it('si avui en fas més, repeteix l\'última d\'aquell dia', () => {
    expect(suggestion(3, last, [])).toEqual({ weightKg: 65, reps: 8 })
  })
  it('sense historial, la sèrie anterior d\'avui', () => {
    expect(suggestion(2, [], [{ weightKg: 40, reps: 12 }, { weightKg: null, reps: null }])).toEqual({ weightKg: 40, reps: 12 })
    expect(suggestion(0, [], [])).toBeNull()
  })
})
