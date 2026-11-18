import type { SQLiteDatabase } from 'expo-sqlite'

// Migracions versionades amb PRAGMA user_version.
// REGLA: una migració publicada no es modifica mai; un canvi d'esquema = una entrada nova al final.
// Les dades viuen només al telèfon: una migració que falla pot fer perdre dades reals.
const MIGRATIONS: string[] = [
  // 1 — esquema inicial
  `
  CREATE TABLE profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    bodyweight_kg REAL,
    default_rest_s INTEGER NOT NULL DEFAULT 90
  );
  INSERT INTO profile (id) VALUES (1);

  -- Preferències de l'usuari per exercici del catàleg (nom propi, descans).
  CREATE TABLE exercise_pref (
    exercise_id TEXT PRIMARY KEY,
    custom_name TEXT,
    rest_s INTEGER
  );

  CREATE TABLE routine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE routine_exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL REFERENCES routine(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3
  );
  CREATE INDEX routine_exercise_routine ON routine_exercise(routine_id, position);

  -- name: còpia del nom de la rutina (l'historial no canvia si la rutina es reanomena o s'esborra).
  -- bodyweight_kg: còpia del pes corporal del perfil en començar.
  CREATE TABLE session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER REFERENCES routine(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    bodyweight_kg REAL
  );
  CREATE INDEX session_started ON session(started_at);

  CREATE TABLE session_exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    position INTEGER NOT NULL
  );
  CREATE INDEX session_exercise_session ON session_exercise(session_id, position);
  CREATE INDEX session_exercise_exercise ON session_exercise(exercise_id);

  -- weight_kg: en exercicis de pes corporal és el LLAST (null/0 = sense llast).
  -- Una sèrie compta a les estadístiques si reps > 0. done_at = marcada com a feta (temporitzador).
  CREATE TABLE set_entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_exercise_id INTEGER NOT NULL REFERENCES session_exercise(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    weight_kg REAL,
    reps INTEGER,
    done_at INTEGER
  );
  CREATE INDEX set_entry_se ON set_entry(session_exercise_id, position);
  `,
]

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const current = row?.user_version ?? 0
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v])
      await db.execAsync(`PRAGMA user_version = ${v + 1}`)
    })
  }
}
