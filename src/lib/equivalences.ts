// «Portes 1.200 kg: com aixecar 1,2 girafes.» Pesos aproximats i arrodonits: són per
// riure, però no inventats (adults típics, vehicles plens a pes màxim d'enlairament o
// de circulació). ORDENATS DE MENYS A MÉS i sense pesos repetits: `equivalence` tria
// l'últim que hi cap, i un test ho comprova.
//
// Densitat: entre 100 kg i 10.000 t cada pas és com a molt ×3,2, perquè hi ha l'entrenament
// real (una sessió ≈ 10 t, un any ≈ 1.000–2.000 t). Per sobre són fites de tota una vida.

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
  { kg: 160, one: 'un goril·la mascle', many: 'goril·les mascles' },
  { kg: 200, one: 'una moto', many: 'motos' },
  { kg: 300, one: 'un piano de cua', many: 'pianos de cua' },
  { kg: 450, one: 'un ós polar', many: 'óssos polars' },
  { kg: 650, one: 'una vaca', many: 'vaques' },
  { kg: 1_000, one: 'un cotxe petit', many: 'cotxes petits' },
  { kg: 1_200, one: 'una girafa mascle', many: 'girafes mascles' },
  { kg: 1_500, one: 'un hipopòtam', many: 'hipopòtams' },
  { kg: 2_300, one: 'un rinoceront blanc', many: 'rinoceronts blancs' },
  { kg: 3_500, one: 'una furgoneta carregada', many: 'furgonetes carregades' },
  { kg: 6_000, one: 'un elefant africà', many: 'elefants africans' },
  { kg: 8_000, one: 'un tiranosaure', many: 'tiranosaures' },
  { kg: 12_000, one: 'un autobús', many: 'autobusos' },
  { kg: 30_000, one: 'una balena geperuda', many: 'balenes geperudes' },
  { kg: 40_000, one: 'un tràiler carregat', many: 'tràilers carregats' },
  { kg: 60_000, one: 'un tanc Leopard 2', many: 'tancs Leopard 2' },
  { kg: 78_000, one: 'un Airbus A320 ple', many: 'Airbus A320 plens' },
  { kg: 150_000, one: 'una balena blava', many: 'balenes blaves' },
  { kg: 200_000, one: "l'Estàtua de la Llibertat", many: 'Estàtues de la Llibertat' },
  { kg: 420_000, one: "l'Estació Espacial Internacional", many: 'Estacions Espacials Internacionals' },
  { kg: 640_000, one: "l'Antonov An-225 ple", many: 'Antonov An-225 plens' },
  { kg: 2_000_000, one: 'un transbordador espacial ple', many: 'transbordadors espacials plens' },
  { kg: 2_900_000, one: 'un coet Saturn V ple', many: 'coets Saturn V plens' },
  { kg: 5_000_000, one: 'un coet Starship ple', many: 'coets Starship plens' },
  { kg: 7_300_000, one: 'la Torre Eiffel', many: 'Torres Eiffel' },
  { kg: 18_000_000, one: 'un submarí nuclear', many: 'submarins nuclears' },
  { kg: 52_000_000, one: 'el Titanic', many: 'Titanics' },
  { kg: 100_000_000, one: 'un portaavions', many: 'portaavions' },
  { kg: 330_000_000, one: "l'Empire State Building", many: 'Empire State Buildings' },
  { kg: 800_000_000, one: 'el pont Golden Gate', many: 'ponts Golden Gate' },
  { kg: 6_000_000_000, one: 'la Gran Piràmide de Guiza', many: 'Grans Piràmides de Guiza' },
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
