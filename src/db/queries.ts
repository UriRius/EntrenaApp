// Tot accés a la base de dades passa per aquí. Les pantalles no escriuen SQL.
import type { SQLiteDatabase } from 'expo-sqlite'

import type { SetRow } from '@/lib/stats'

type Db = SQLiteDatabase
const now = () => Date.now()

// ---------- Perfil ----------

export interface Profile {
  bodyweightKg: number | null
  defaultRestS: number
}

export async function getProfile(db: Db): Promise<Profile> {
  const r = await db.getFirstAsync<{ bodyweight_kg: number | null; default_rest_s: number }>(
    'SELECT bodyweight_kg, default_rest_s FROM profile WHERE id = 1',
  )
  return { bodyweightKg: r?.bodyweight_kg ?? null, defaultRestS: r?.default_rest_s ?? 90 }
}

export async function setBodyweight(db: Db, kg: number | null): Promise<void> {
  await db.runAsync('UPDATE profile SET bodyweight_kg = ? WHERE id = 1', kg)
}

export async function setDefaultRest(db: Db, seconds: number): Promise<void> {
  await db.runAsync('UPDATE profile SET default_rest_s = ? WHERE id = 1', seconds)
}

// ---------- Preferències per exercici ----------

export interface ExercisePref {
  customName: string | null
  restS: number | null
}

export async function getPrefs(db: Db): Promise<Map<string, ExercisePref>> {
  const rows = await db.getAllAsync<{ exercise_id: string; custom_name: string | null; rest_s: number | null }>(
    'SELECT exercise_id, custom_name, rest_s FROM exercise_pref',
  )
  return new Map(rows.map(r => [r.exercise_id, { customName: r.custom_name, restS: r.rest_s }]))
}

export async function setCustomName(db: Db, exerciseId: string, name: string | null): Promise<void> {
  const clean = name?.trim() || null
  await db.runAsync(
    `INSERT INTO exercise_pref (exercise_id, custom_name) VALUES (?, ?)
     ON CONFLICT(exercise_id) DO UPDATE SET custom_name = excluded.custom_name`,
    exerciseId,
    clean,
  )
}

export async function setExerciseRest(db: Db, exerciseId: string, seconds: number | null): Promise<void> {
  await db.runAsync(
    `INSERT INTO exercise_pref (exercise_id, rest_s) VALUES (?, ?)
     ON CONFLICT(exercise_id) DO UPDATE SET rest_s = excluded.rest_s`,
    exerciseId,
    seconds,
  )
}

// ---------- Rutines ----------

export interface RoutineSummary {
  id: number
  name: string
  exerciseIds: string[]
  lastDoneAt: number | null
}

export async function listRoutines(db: Db): Promise<RoutineSummary[]> {
  const routines = await db.getAllAsync<{ id: number; name: string; last_done: number | null }>(
    `SELECT r.id, r.name, (SELECT MAX(s.started_at) FROM session s WHERE s.routine_id = r.id) AS last_done
     FROM routine r ORDER BY r.position, r.id`,
  )
  const items = await db.getAllAsync<{ routine_id: number; exercise_id: string }>(
    'SELECT routine_id, exercise_id FROM routine_exercise ORDER BY position, id',
  )
  return routines.map(r => ({
    id: r.id,
    name: r.name,
    lastDoneAt: r.last_done,
    exerciseIds: items.filter(i => i.routine_id === r.id).map(i => i.exercise_id),
  }))
}

export async function createRoutine(db: Db, name: string): Promise<number> {
  const pos = await db.getFirstAsync<{ p: number | null }>('SELECT MAX(position) AS p FROM routine')
  const res = await db.runAsync(
    'INSERT INTO routine (name, position, created_at) VALUES (?, ?, ?)',
    name,
    (pos?.p ?? -1) + 1,
    now(),
  )
  return res.lastInsertRowId
}

export async function renameRoutine(db: Db, id: number, name: string): Promise<void> {
  await db.runAsync('UPDATE routine SET name = ? WHERE id = ?', name, id)
}

export async function deleteRoutine(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM routine WHERE id = ?', id)
}

export interface RoutineItem {
  id: number
  exerciseId: string
  sets: number
}

export interface RoutineDetail {
  id: number
  name: string
  items: RoutineItem[]
}

export async function getRoutine(db: Db, id: number): Promise<RoutineDetail | null> {
  const r = await db.getFirstAsync<{ id: number; name: string }>('SELECT id, name FROM routine WHERE id = ?', id)
  if (!r) return null
  const items = await db.getAllAsync<{ id: number; exercise_id: string; sets: number }>(
    'SELECT id, exercise_id, sets FROM routine_exercise WHERE routine_id = ? ORDER BY position, id',
    id,
  )
  return { id: r.id, name: r.name, items: items.map(i => ({ id: i.id, exerciseId: i.exercise_id, sets: i.sets })) }
}

export async function addRoutineExercise(db: Db, routineId: number, exerciseId: string): Promise<void> {
  const pos = await db.getFirstAsync<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM routine_exercise WHERE routine_id = ?',
    routineId,
  )
  await db.runAsync(
    'INSERT INTO routine_exercise (routine_id, exercise_id, position, sets) VALUES (?, ?, ?, 3)',
    routineId,
    exerciseId,
    (pos?.p ?? -1) + 1,
  )
}

export async function setRoutineItemSets(db: Db, itemId: number, sets: number): Promise<void> {
  await db.runAsync('UPDATE routine_exercise SET sets = ? WHERE id = ?', Math.max(1, Math.min(10, sets)), itemId)
}

export async function removeRoutineItem(db: Db, itemId: number): Promise<void> {
  await db.runAsync('DELETE FROM routine_exercise WHERE id = ?', itemId)
}

/** Reescriu les posicions segons l'ordre donat (llista d'ids de routine_exercise). */
export async function reorderRoutineItems(db: Db, orderedIds: number[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync('UPDATE routine_exercise SET position = ? WHERE id = ?', i, orderedIds[i])
    }
  })
}

// ---------- Sessions ----------

export interface ActiveSession {
  id: number
  name: string
  startedAt: number
}

export async function getActiveSession(db: Db): Promise<ActiveSession | null> {
  const r = await db.getFirstAsync<{ id: number; name: string; started_at: number }>(
    'SELECT id, name, started_at FROM session WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1',
  )
  return r ? { id: r.id, name: r.name, startedAt: r.started_at } : null
}

/** Crea la sessió a partir de la rutina: exercicis i sèries previstes (buides). */
export async function startSession(db: Db, routineId: number): Promise<number> {
  const routine = await getRoutine(db, routineId)
  if (!routine) throw new Error(`Rutina ${routineId} no trobada`)
  const profile = await getProfile(db)
  let sessionId = 0
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      'INSERT INTO session (routine_id, name, started_at, bodyweight_kg) VALUES (?, ?, ?, ?)',
      routineId,
      routine.name,
      now(),
      profile.bodyweightKg,
    )
    sessionId = res.lastInsertRowId
    for (let i = 0; i < routine.items.length; i++) {
      const item = routine.items[i]
      const se = await db.runAsync(
        'INSERT INTO session_exercise (session_id, exercise_id, position) VALUES (?, ?, ?)',
        sessionId,
        item.exerciseId,
        i,
      )
      for (let s = 0; s < item.sets; s++) {
        await db.runAsync('INSERT INTO set_entry (session_exercise_id, position) VALUES (?, ?)', se.lastInsertRowId, s)
      }
    }
  })
  return sessionId
}

export interface SetEntry {
  id: number
  position: number
  weightKg: number | null
  reps: number | null
  doneAt: number | null
}

export interface SessionExercise {
  id: number
  exerciseId: string
  sets: SetEntry[]
}

export interface SessionDetail {
  id: number
  name: string
  startedAt: number
  finishedAt: number | null
  bodyweightKg: number | null
  exercises: SessionExercise[]
}

export async function getSession(db: Db, id: number): Promise<SessionDetail | null> {
  const s = await db.getFirstAsync<{
    id: number
    name: string
    started_at: number
    finished_at: number | null
    bodyweight_kg: number | null
  }>('SELECT id, name, started_at, finished_at, bodyweight_kg FROM session WHERE id = ?', id)
  if (!s) return null
  const exercises = await db.getAllAsync<{ id: number; exercise_id: string }>(
    'SELECT id, exercise_id FROM session_exercise WHERE session_id = ? ORDER BY position, id',
    id,
  )
  const sets = await db.getAllAsync<{
    id: number
    session_exercise_id: number
    position: number
    weight_kg: number | null
    reps: number | null
    done_at: number | null
  }>(
    `SELECT st.id, st.session_exercise_id, st.position, st.weight_kg, st.reps, st.done_at
     FROM set_entry st JOIN session_exercise se ON se.id = st.session_exercise_id
     WHERE se.session_id = ? ORDER BY st.position, st.id`,
    id,
  )
  return {
    id: s.id,
    name: s.name,
    startedAt: s.started_at,
    finishedAt: s.finished_at,
    bodyweightKg: s.bodyweight_kg,
    exercises: exercises.map(e => ({
      id: e.id,
      exerciseId: e.exercise_id,
      sets: sets
        .filter(st => st.session_exercise_id === e.id)
        .map(st => ({ id: st.id, position: st.position, weightKg: st.weight_kg, reps: st.reps, doneAt: st.done_at })),
    })),
  }
}

export async function addSessionExercise(db: Db, sessionId: number, exerciseId: string, sets = 3): Promise<void> {
  await db.withTransactionAsync(async () => {
    const pos = await db.getFirstAsync<{ p: number | null }>(
      'SELECT MAX(position) AS p FROM session_exercise WHERE session_id = ?',
      sessionId,
    )
    const se = await db.runAsync(
      'INSERT INTO session_exercise (session_id, exercise_id, position) VALUES (?, ?, ?)',
      sessionId,
      exerciseId,
      (pos?.p ?? -1) + 1,
    )
    for (let s = 0; s < sets; s++) {
      await db.runAsync('INSERT INTO set_entry (session_exercise_id, position) VALUES (?, ?)', se.lastInsertRowId, s)
    }
  })
}

export async function removeSessionExercise(db: Db, sessionExerciseId: number): Promise<void> {
  await db.runAsync('DELETE FROM session_exercise WHERE id = ?', sessionExerciseId)
}

export async function addSet(db: Db, sessionExerciseId: number): Promise<void> {
  const pos = await db.getFirstAsync<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM set_entry WHERE session_exercise_id = ?',
    sessionExerciseId,
  )
  await db.runAsync(
    'INSERT INTO set_entry (session_exercise_id, position) VALUES (?, ?)',
    sessionExerciseId,
    (pos?.p ?? -1) + 1,
  )
}

export async function removeSet(db: Db, setId: number): Promise<void> {
  await db.runAsync('DELETE FROM set_entry WHERE id = ?', setId)
}

export async function updateSet(
  db: Db,
  setId: number,
  values: { weightKg: number | null; reps: number | null; doneAt: number | null },
): Promise<void> {
  await db.runAsync(
    'UPDATE set_entry SET weight_kg = ?, reps = ?, done_at = ? WHERE id = ?',
    values.weightKg,
    values.reps,
    values.doneAt,
    setId,
  )
}

export async function finishSession(db: Db, id: number): Promise<void> {
  await db.runAsync('UPDATE session SET finished_at = ? WHERE id = ? AND finished_at IS NULL', now(), id)
}

export async function deleteSession(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM session WHERE id = ?', id)
}

export interface LastTime {
  sessionId: number
  startedAt: number
  sets: { weightKg: number | null; reps: number | null }[]
}

/** L'última sessió (anterior a `beforeSessionId`) on l'exercici té alguna sèrie amb reps. */
export async function lastTimeFor(db: Db, exerciseId: string, beforeSessionId?: number): Promise<LastTime | null> {
  const s = await db.getFirstAsync<{ session_id: number; started_at: number; se_id: number }>(
    `SELECT s.id AS session_id, s.started_at, se.id AS se_id
     FROM session s JOIN session_exercise se ON se.session_id = s.id
     WHERE se.exercise_id = ? AND s.id != ?
       AND s.started_at < COALESCE((SELECT started_at FROM session WHERE id = ?), 9e15)
       AND EXISTS (SELECT 1 FROM set_entry st WHERE st.session_exercise_id = se.id AND st.reps > 0)
     ORDER BY s.started_at DESC, se.position DESC LIMIT 1`,
    exerciseId,
    beforeSessionId ?? -1,
    beforeSessionId ?? -1,
  )
  if (!s) return null
  const sets = await db.getAllAsync<{ weight_kg: number | null; reps: number | null }>(
    'SELECT weight_kg, reps FROM set_entry WHERE session_exercise_id = ? AND reps > 0 ORDER BY position, id',
    s.se_id,
  )
  return { sessionId: s.session_id, startedAt: s.started_at, sets: sets.map(r => ({ weightKg: r.weight_kg, reps: r.reps })) }
}

// ---------- Historial i estadístiques ----------

export interface SessionListItem {
  id: number
  name: string
  startedAt: number
  finishedAt: number | null
  exerciseCount: number
}

export async function listSessions(db: Db): Promise<SessionListItem[]> {
  const rows = await db.getAllAsync<{
    id: number
    name: string
    started_at: number
    finished_at: number | null
    exercises: number
  }>(
    `SELECT s.id, s.name, s.started_at, s.finished_at,
            (SELECT COUNT(*) FROM session_exercise se WHERE se.session_id = s.id) AS exercises
     FROM session s ORDER BY s.started_at DESC`,
  )
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    exerciseCount: r.exercises,
  }))
}

/** Sèries amb repeticions (les comptades), amb el context que necessiten els càlculs. */
export async function setRows(
  db: Db,
  isBodyweight: (exerciseId: string) => boolean,
  opts: { since?: number; exerciseId?: string } = {},
): Promise<SetRow[]> {
  const rows = await db.getAllAsync<{
    session_id: number
    started_at: number
    exercise_id: string
    weight_kg: number | null
    reps: number | null
    bodyweight_kg: number | null
  }>(
    `SELECT s.id AS session_id, s.started_at, se.exercise_id, st.weight_kg, st.reps, s.bodyweight_kg
     FROM set_entry st
     JOIN session_exercise se ON se.id = st.session_exercise_id
     JOIN session s ON s.id = se.session_id
     WHERE st.reps > 0 AND s.started_at >= ? AND (? IS NULL OR se.exercise_id = ?)
     ORDER BY s.started_at, se.position, st.position`,
    opts.since ?? 0,
    opts.exerciseId ?? null,
    opts.exerciseId ?? null,
  )
  return rows.map(r => ({
    sessionId: r.session_id,
    startedAt: r.started_at,
    exerciseId: r.exercise_id,
    weightKg: r.weight_kg,
    reps: r.reps,
    bodyweightKg: r.bodyweight_kg,
    isBodyweight: isBodyweight(r.exercise_id),
  }))
}

/** Exercicis que surten a alguna rutina (per descarregar-ne els GIF). */
export async function exercisesInUse(db: Db): Promise<string[]> {
  const rows = await db.getAllAsync<{ exercise_id: string }>(
    `SELECT DISTINCT exercise_id FROM routine_exercise
     UNION SELECT DISTINCT exercise_id FROM session_exercise`,
  )
  return rows.map(r => r.exercise_id)
}
