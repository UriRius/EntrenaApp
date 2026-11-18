// Càlculs de progrés. Pur i provat (stats.test.ts): cap pantalla recalcula res pel seu compte.
//
// Definicions (també explicades a la pantalla):
//  * Sèrie comptada: té repeticions > 0. Les sèries buides (previstes però no fetes) no compten.
//  * Pes d'una sèrie: el que s'apunta. En exercicis de pes corporal s'apunta el pes
//    AFEGIT (0 si no n'hi ha) i hi sumem el pes corporal guardat a la sessió.
//  * Pes total mogut (volum) = Σ pes × repeticions.
//  * 1RM estimat (Epley) = pes × (1 + reps / 30); només amb 1–12 reps i pes > 0.

export interface SetRow {
  sessionId: number
  startedAt: number
  exerciseId: string
  weightKg: number | null
  reps: number | null
  /** Pes corporal guardat a la sessió (null si el perfil no en tenia). */
  bodyweightKg: number | null
  isBodyweight: boolean
}

export function isCounted(s: Pick<SetRow, 'reps'>): boolean {
  return s.reps != null && s.reps > 0
}

/** Pes efectiu d'una sèrie (pes corporal + afegit en exercicis de pes corporal). */
export function effectiveWeight(s: SetRow): number {
  const added = s.weightKg ?? 0
  return s.isBodyweight ? (s.bodyweightKg ?? 0) + added : added
}

export interface VolumeSummary {
  totalKg: number
  sets: number
  reps: number
  sessions: number
  /** Sèries de pes corporal on no sabíem el pes corporal (només s'hi ha comptat l'afegit). */
  setsMissingBodyweight: number
}

export function volume(sets: readonly SetRow[]): VolumeSummary {
  let totalKg = 0
  let count = 0
  let reps = 0
  let missing = 0
  const sessions = new Set<number>()
  for (const s of sets) {
    if (!isCounted(s)) continue
    totalKg += effectiveWeight(s) * (s.reps as number)
    count++
    reps += s.reps as number
    sessions.add(s.sessionId)
    if (s.isBodyweight && s.bodyweightKg == null) missing++
  }
  return { totalKg, sets: count, reps, sessions: sessions.size, setsMissingBodyweight: missing }
}

export function estimatedOneRepMax(weightKg: number, reps: number): number | null {
  if (!(weightKg > 0) || !(reps >= 1) || reps > 12) return null
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30)
}

export interface ExerciseRecords {
  /** Sèrie amb més pes (en empat, la de més reps). Pes corporal: per reps. */
  best: { weightKg: number; reps: number; at: number } | null
  bestOneRepMax: { valueKg: number; at: number } | null
  maxReps: { reps: number; weightKg: number; at: number } | null
}

/** Rècords d'UN exercici. En pes corporal, `best` es mesura amb el pes afegit. */
export function records(sets: readonly SetRow[]): ExerciseRecords {
  let best: ExerciseRecords['best'] = null
  let bestOneRepMax: ExerciseRecords['bestOneRepMax'] = null
  let maxReps: ExerciseRecords['maxReps'] = null
  for (const s of sets) {
    if (!isCounted(s)) continue
    const reps = s.reps as number
    const w = s.weightKg ?? 0
    if (!best || w > best.weightKg || (w === best.weightKg && reps > best.reps)) {
      best = { weightKg: w, reps, at: s.startedAt }
    }
    if (!maxReps || reps > maxReps.reps || (reps === maxReps.reps && w > maxReps.weightKg)) {
      maxReps = { reps, weightKg: w, at: s.startedAt }
    }
    if (!s.isBodyweight) {
      const e = estimatedOneRepMax(w, reps)
      if (e != null && (!bestOneRepMax || e > bestOneRepMax.valueKg)) {
        bestOneRepMax = { valueKg: e, at: s.startedAt }
      }
    }
  }
  return { best, bestOneRepMax, maxReps }
}

export interface Point {
  at: number
  value: number
}

/**
 * Un punt per sessió on es va fer l'exercici (mai zeros inventats per a sessions sense dades):
 *  - metric 'weight': pes màxim de la sessió
 *  - metric 'reps': màxim de repeticions en una sèrie (per a pes corporal sense llast)
 */
export function progressSeries(sets: readonly SetRow[], metric: 'weight' | 'reps'): Point[] {
  const bySession = new Map<number, Point>()
  for (const s of sets) {
    if (!isCounted(s)) continue
    const value = metric === 'weight' ? (s.weightKg ?? 0) : (s.reps as number)
    const prev = bySession.get(s.sessionId)
    if (!prev || value > prev.value) bySession.set(s.sessionId, { at: s.startedAt, value })
  }
  return [...bySession.values()].sort((a, b) => a.at - b.at)
}

/** Quina mètrica té sentit per a l'evolució d'aquest exercici. */
export function progressMetric(sets: readonly SetRow[], isBodyweight: boolean): 'weight' | 'reps' {
  if (!isBodyweight) return 'weight'
  return sets.some(s => isCounted(s) && (s.weightKg ?? 0) > 0) ? 'weight' : 'reps'
}

export type Period = 'month' | 'year' | 'all'

/** Inici del període (hora local) que conté `now`. */
export function periodStart(period: Period, now: number): number {
  const d = new Date(now)
  if (period === 'month') return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  if (period === 'year') return new Date(d.getFullYear(), 0, 1).getTime()
  return 0
}

export interface PlannedValue {
  weightKg: number | null
  reps: number | null
}

/**
 * Valor suggerit (placeholder) per a la sèrie `index`: la mateixa sèrie de l'última
 * vegada; si aquell dia en vas fer menys, l'última d'aquell dia; si no hi ha historial,
 * la sèrie anterior d'avui.
 */
export function suggestion(
  index: number,
  lastTime: readonly PlannedValue[],
  today: readonly PlannedValue[],
): PlannedValue | null {
  const fromLast = lastTime[index] ?? lastTime[lastTime.length - 1]
  if (fromLast) return fromLast
  for (let i = index - 1; i >= 0; i--) {
    const prev = today[i]
    if (prev && prev.reps != null && prev.reps > 0) return prev
  }
  return null
}
