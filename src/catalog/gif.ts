// GIF dels exercicis: es descarreguen una vegada al telèfon i després funcionen sense connexió.
import { Directory, File, Paths } from 'expo-file-system'

import { getExercise } from './index'

let dir: Directory | null = null
function gifDir(): Directory {
  if (!dir) {
    dir = new Directory(Paths.document, 'gifs')
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true })
  }
  return dir
}

function localFile(id: string): File {
  return new File(gifDir(), `${id}.gif`)
}

/** Font per a <Image>: el fitxer local si ja el tenim; si no, l'URL (cal connexió). */
export function gifSource(id: string): { uri: string } | null {
  try {
    const f = localFile(id)
    if (f.exists) return { uri: f.uri }
  } catch {
    // sense sistema de fitxers (p. ex. web): fem servir l'URL
  }
  const url = getExercise(id).gifUrl
  return url ? { uri: url } : null
}

const pending = new Map<string, Promise<void>>()

/** Descarrega el GIF si encara no hi és. Mai llença: sense connexió es reintentarà més tard. */
export function ensureGif(id: string): Promise<void> {
  const existing = pending.get(id)
  if (existing) return existing
  const task = (async () => {
    const url = getExercise(id).gifUrl
    if (!url) return
    try {
      const f = localFile(id)
      if (f.exists) return
      await File.downloadFileAsync(url, f, { idempotent: true })
    } catch {
      // sense connexió o error del servidor: es tornarà a provar en obrir l'app
    } finally {
      pending.delete(id)
    }
  })()
  pending.set(id, task)
  return task
}

export async function ensureGifs(ids: readonly string[]): Promise<void> {
  for (const id of ids) await ensureGif(id) // d'un en un: l'API gratuïta limita les peticions
}
