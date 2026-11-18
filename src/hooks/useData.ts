import { useFocusEffect } from 'expo-router'
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carrega dades cada cop que la pantalla torna a tenir el focus (les altres pantalles
 * poden haver-les canviat) i exposa `reload` per després d'una escriptura.
 * `key`: el valor de què depèn `load` (p. ex. l'id de la ruta).
 */
export function useData<T>(load: (db: SQLiteDatabase) => Promise<T>, key?: string | number) {
  const db = useSQLiteContext()
  const [data, setData] = useState<T | undefined>(undefined)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  const reload = useCallback(async () => setData(await loadRef.current(db)), [db])

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload, key]), // eslint-disable-line react-hooks/exhaustive-deps
  )

  return { data, reload, db }
}

/** Hora actual per a gestors d'esdeveniments (fora del render). */
export const timestamp = (): number => Date.now()
