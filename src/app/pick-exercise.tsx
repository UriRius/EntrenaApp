import { router, useLocalSearchParams } from 'expo-router'
import { useSQLiteContext } from 'expo-sqlite'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { CATALOG, displayName } from '@/catalog'
import { ensureGif } from '@/catalog/gif'
import { addRoutineExercise, addSessionExercise, getPrefs, type ExercisePref } from '@/db/queries'
import { t } from '@/i18n'
import { BODY_PARTS, BODY_PART_ORDER, EQUIPMENTS, label, searchCatalog } from '@/lib/catalog'
import { colors, space } from '@/theme/tokens'
import { Body, Chip, ExerciseImage, Field, Muted } from '@/ui'

/** Selector d'exercicis. Afegeix a una rutina (routineId) o a la sessió en curs (sessionId). */
export default function PickExerciseScreen() {
  const params = useLocalSearchParams<{ routineId?: string; sessionId?: string }>()
  const db = useSQLiteContext()
  const [query, setQuery] = useState('')
  const [bodyPart, setBodyPart] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Map<string, ExercisePref>>(new Map())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getPrefs(db).then(setPrefs)
  }, [db])

  const customNames = useMemo(
    () => new Map([...prefs].filter(([, p]) => p.customName).map(([id, p]) => [id, p.customName as string])),
    [prefs],
  )
  const results = useMemo(() => searchCatalog(CATALOG, query, { bodyPart, customNames }), [query, bodyPart, customNames])

  async function pick(exerciseId: string) {
    if (busy) return
    setBusy(true)
    if (params.routineId) await addRoutineExercise(db, Number(params.routineId), exerciseId)
    else if (params.sessionId) await addSessionExercise(db, Number(params.sessionId), exerciseId)
    void ensureGif(exerciseId) // en segon pla: si no hi ha connexió, es reintenta en obrir l'app
    router.back()
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ padding: space[4], paddingBottom: space[2], gap: space[3] }}>
        <Field value={query} onChangeText={setQuery} placeholder={t('picker.search')} autoFocus autoCorrect={false} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
          <Chip label={t('picker.all')} selected={bodyPart === null} onPress={() => setBodyPart(null)} />
          {BODY_PART_ORDER.map(bp => (
            <Chip key={bp} label={label(BODY_PARTS, bp)} selected={bodyPart === bp} onPress={() => setBodyPart(bp)} />
          ))}
        </ScrollView>
        <Muted>{t('picker.count', { n: results.length })}</Muted>
      </View>
      <FlatList
        data={results}
        keyExtractor={e => e.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
        contentContainerStyle={{ paddingHorizontal: space[4], paddingBottom: space[10] }}
        ListEmptyComponent={<Muted style={{ textAlign: 'center', marginTop: space[8] }}>{t('picker.noResults')}</Muted>}
        renderItem={({ item }) => (
          <Pressable onPress={() => pick(item.id)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <ExerciseImage id={item.id} size={52} still />
            <View style={{ flex: 1, gap: 2 }}>
              <Body numberOfLines={2} style={{ color: colors.heading, fontWeight: '600' }}>
                {displayName(item.id, prefs)}
              </Body>
              <Muted numberOfLines={1}>
                {item.bodyParts.map(b => label(BODY_PARTS, b)).join(', ')} · {item.equipments.map(e => label(EQUIPMENTS, e)).join(', ')}
              </Muted>
            </View>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
})
