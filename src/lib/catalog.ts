// Catàleg d'exercicis (ExerciseDB, versió gratuïta). Pur: rep les dades, no les carrega.

export interface CatalogExercise {
  id: string
  name: string
  gifUrl: string
  bodyParts: string[]
  equipments: string[]
  targetMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
}

/** Pes corporal (s'apunta només el llast): flexions, dominades, fons, i les seves versions amb llast. */
export function isBodyweight(e: Pick<CatalogExercise, 'equipments'>): boolean {
  return e.equipments.some(eq => eq === 'bodyweight' || eq === 'weighted')
}

// Etiquetes en català. El que no surt aquí es mostra tal com ve (en anglès).
export const BODY_PARTS: Record<string, string> = {
  chest: 'Pit',
  back: 'Esquena',
  shoulders: 'Espatlles',
  'upper arms': 'Braços',
  'lower arms': 'Avantbraços',
  'upper legs': 'Cuixes',
  'lower legs': 'Bessons',
  waist: 'Abdomen',
  cardio: 'Cardio',
  neck: 'Coll',
}

/** Ordre dels filtres al selector (els més habituals primer). */
export const BODY_PART_ORDER = ['chest', 'back', 'shoulders', 'upper arms', 'upper legs', 'lower legs', 'waist', 'lower arms', 'cardio', 'neck']

export const EQUIPMENTS: Record<string, string> = {
  bodyweight: 'pes corporal',
  weighted: 'amb llast',
  barbell: 'barra',
  'olympic barbell': 'barra olímpica',
  'EZ bar': 'barra Z',
  'trap bar': 'barra hexagonal',
  dumbbell: 'manuelles',
  kettlebell: 'kettlebell',
  cable: 'politja',
  'leverage machine': 'màquina',
  'smith machine': 'màquina Smith',
  'sled machine': 'premsa',
  assisted: 'assistit',
  'resistance band': 'banda elàstica',
  'stability ball': 'fitball',
  'medicine ball': 'pilota medicinal',
  'bosu ball': 'bosu',
  'suspension trainer': 'TRX',
  roller: 'roller',
  rope: 'corda',
}

export const MUSCLES: Record<string, string> = {
  pectorals: 'pectorals',
  'latissimus dorsi': 'dorsal ample',
  'upper back': 'part alta de l\'esquena',
  'erector spinae': 'lumbars',
  trapezius: 'trapezi',
  deltoids: 'deltoides',
  biceps: 'bíceps',
  triceps: 'tríceps',
  forearms: 'avantbraços',
  quadriceps: 'quàdriceps',
  hamstrings: 'isquiotibials',
  glutes: 'glutis',
  adductors: 'adductors',
  abductors: 'abductors',
  calves: 'bessons',
  abdominals: 'abdominals',
  'serratus anterior': 'serrat anterior',
  'levator scapulae': 'elevador de l\'escàpula',
  'cardiovascular system': 'sistema cardiovascular',
}

export const label = (dict: Record<string, string>, key: string): string => dict[key] ?? key

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Cerca per paraules (totes han d'aparèixer, en qualsevol ordre) al nom original
 * i al nom propi que li hagi posat l'usuari. "press banca" troba "Press banca";
 * "bench db" troba "dumbbell bench press" gràcies als àlies d'abreviatures.
 */
const ALIASES: Record<string, string> = { db: 'dumbbell', bb: 'barbell', kb: 'kettlebell' }

export function searchCatalog(
  catalog: readonly CatalogExercise[],
  query: string,
  opts: { bodyPart?: string | null; customNames?: ReadonlyMap<string, string> } = {},
): CatalogExercise[] {
  const words = normalize(query)
    .split(' ')
    .filter(Boolean)
    .map(w => ALIASES[w] ?? w)
  const custom = opts.customNames
  return catalog.filter(e => {
    if (opts.bodyPart && !e.bodyParts.includes(opts.bodyPart)) return false
    if (words.length === 0) return true
    const hay = normalize(`${e.name} ${custom?.get(e.id) ?? ''}`)
    return words.every(w => hay.includes(w))
  })
}
