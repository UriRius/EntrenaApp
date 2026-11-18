// «Portes 1.200 kg: com aixecar 12 neveres.» Pesos aproximats i arrodonits:
// són per riure, però no inventats. Ordenats de menys a més.

export interface Thing {
  kg: number
  one: string // "una nevera"
  many: string // "neveres"
}

export const THINGS: readonly Thing[] = [
  { kg: 4, one: 'un gat', many: 'gats' },
  { kg: 20, one: 'una maleta plena', many: 'maletes plenes' },
  { kg: 70, one: 'una rentadora', many: 'rentadores' },
  { kg: 100, one: 'una nevera', many: 'neveres' },
  { kg: 200, one: 'una moto', many: 'motos' },
  { kg: 500, one: 'un cavall', many: 'cavalls' },
  { kg: 1_200, one: 'un cotxe', many: 'cotxes' },
  { kg: 2_300, one: 'un rinoceront', many: 'rinoceronts' },
  { kg: 6_000, one: 'un elefant', many: 'elefants' },
  { kg: 12_000, one: 'un autobús', many: 'autobusos' },
  { kg: 60_000, one: 'un tanc', many: 'tancs' },
  { kg: 150_000, one: 'una balena blava', many: 'balenes blaves' },
  { kg: 400_000, one: 'un Boeing 747 ple', many: 'Boeings 747 plens' },
  { kg: 7_300_000, one: 'la Torre Eiffel', many: 'Torres Eiffel' },
]

export interface Equivalence {
  thing: Thing
  count: number // quantes vegades (≥ 1, excepte si el total és més petit que la cosa més lleugera)
}

/**
 * La cosa més pesant que encara cap sencera dins el total, i quantes vegades.
 * Retorna null si el total és 0 (no s'inventa cap comparació).
 */
export function equivalence(totalKg: number): Equivalence | null {
  if (!(totalKg > 0)) return null
  let pick = THINGS[0]
  for (const thing of THINGS) {
    if (thing.kg <= totalKg) pick = thing
  }
  return { thing: pick, count: totalKg / pick.kg }
}

/** Nombre de vegades llegible: < 10 amb un decimal ("1,5"), ≥ 10 sencer ("12"). */
export function roundCount(count: number): number {
  return count < 10 ? Math.round(count * 10) / 10 : Math.round(count)
}
