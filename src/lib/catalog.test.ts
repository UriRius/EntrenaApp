import { describe, expect, it } from 'vitest'
import { isBodyweight, searchCatalog, type CatalogExercise } from './catalog'

const ex = (id: string, name: string, bodyPart = 'chest', equipments = ['barbell']): CatalogExercise => ({
  id,
  name,
  gifUrl: '',
  bodyParts: [bodyPart],
  equipments,
  targetMuscles: [],
  secondaryMuscles: [],
  instructions: [],
})

const catalog = [
  ex('1', 'barbell bench press'),
  ex('2', 'dumbbell bench press', 'chest', ['dumbbell']),
  ex('3', 'pull-up', 'back', ['bodyweight']),
  ex('4', 'barbell full squat', 'upper legs'),
]

describe('searchCatalog', () => {
  it('totes les paraules, en qualsevol ordre', () => {
    expect(searchCatalog(catalog, 'press bench').map(e => e.id)).toEqual(['1', '2'])
  })
  it('abreviatures', () => {
    expect(searchCatalog(catalog, 'db bench').map(e => e.id)).toEqual(['2'])
  })
  it('guionets i majúscules', () => {
    expect(searchCatalog(catalog, 'Pull Up').map(e => e.id)).toEqual(['3'])
  })
  it('nom propi en català', () => {
    const names = new Map([['1', 'Press banca']])
    expect(searchCatalog(catalog, 'banca', { customNames: names }).map(e => e.id)).toEqual(['1'])
  })
  it('filtre per part del cos', () => {
    expect(searchCatalog(catalog, '', { bodyPart: 'back' }).map(e => e.id)).toEqual(['3'])
  })
})

describe('isBodyweight', () => {
  it('pes corporal i amb llast', () => {
    expect(isBodyweight({ equipments: ['bodyweight'] })).toBe(true)
    expect(isBodyweight({ equipments: ['weighted'] })).toBe(true)
    expect(isBodyweight({ equipments: ['barbell'] })).toBe(false)
  })
})
