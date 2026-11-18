// El catàleg va dins l'app (assets/catalog.json, generat amb scripts/fetch-catalog.mjs).
import type { ExercisePref } from '@/db/queries'
import { isBodyweight, type CatalogExercise } from '@/lib/catalog'

export const CATALOG: readonly CatalogExercise[] = require('../../assets/catalog.json')

const BY_ID = new Map(CATALOG.map(e => [e.id, e]))

/** Exercici del catàleg; si algun dia un id desapareix del catàleg, no petem. */
export function getExercise(id: string): CatalogExercise {
  return (
    BY_ID.get(id) ?? {
      id,
      name: id,
      gifUrl: '',
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      secondaryMuscles: [],
      instructions: [],
    }
  )
}

export function exerciseIsBodyweight(id: string): boolean {
  return isBodyweight(getExercise(id))
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Nom que veu l'usuari: el seu nom propi, o l'original amb majúscula inicial. */
export function displayName(id: string, prefs?: ReadonlyMap<string, ExercisePref>): string {
  return prefs?.get(id)?.customName || capitalize(getExercise(id).name)
}
