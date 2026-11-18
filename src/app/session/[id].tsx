import Ionicons from '@expo/vector-icons/Ionicons'
import * as Haptics from 'expo-haptics'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import type { SQLiteDatabase } from 'expo-sqlite'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { displayName, exerciseIsBodyweight } from '@/catalog'
import {
  addSet,
  deleteSession,
  finishSession,
  getPrefs,
  getProfile,
  getSession,
  lastTimeFor,
  removeSessionExercise,
  removeSet,
  updateSet,
  type ExercisePref,
  type LastTime,
  type SessionExercise,
} from '@/db/queries'
import { timestamp, useData } from '@/hooks/useData'
import { t } from '@/i18n'
import { equivalence, roundCount } from '@/lib/equivalences'
import { formatDuration, formatKg, formatLongDate, formatNumber, formatShortDate, parseDecimal, parseInteger } from '@/lib/format'
import { suggestion, volume, type PlannedValue, type SetRow } from '@/lib/stats'
import { RestBar, useRestTimer } from '@/rest/RestTimer'
import { colors, fontSize, radius, space } from '@/theme/tokens'
import { Body, Button, Card, ExerciseImage, IconButton, Muted, Row, Screen } from '@/ui'
import { confirm, inform } from '@/ui/dialogs'

async function load(db: SQLiteDatabase, id: number) {
  const session = await getSession(db, id)
  const lastTimes = new Map<string, LastTime | null>()
  if (session) {
    for (const e of session.exercises) {
      if (!lastTimes.has(e.exerciseId)) lastTimes.set(e.exerciseId, await lastTimeFor(db, e.exerciseId, id))
    }
  }
  return { session, lastTimes, prefs: await getPrefs(db), profile: await getProfile(db) }
}

export default function SessionScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id)
  const { data, reload, db } = useData(d => load(d, id), id)
  const timer = useRestTimer()

  if (!data) return <Screen>{null}</Screen>
  const { session, lastTimes, prefs, profile } = data
  if (!session) return <Screen>{null}</Screen>
  const active = session.finishedAt == null

  function onFinish() {
    confirm(t('session.finishTitle'), t('session.finishBody'), t('session.finish'), async () => {
      await finishSession(db, id)
      timer.skip()
      const fresh = await getSession(db, id)
      const rows: SetRow[] = (fresh?.exercises ?? []).flatMap(e =>
        e.sets.map(s => ({
          sessionId: id,
          startedAt: session!.startedAt,
          exerciseId: e.exerciseId,
          weightKg: s.weightKg,
          reps: s.reps,
          bodyweightKg: session!.bodyweightKg,
          isBodyweight: exerciseIsBodyweight(e.exerciseId),
        })),
      )
      const v = volume(rows)
      const eq = equivalence(v.totalKg)
      const body = [
        t('session.finishedBody', { total: formatKg(v.totalKg, 0), sets: v.sets }),
        eq ? t('session.finishedEquivalence', { thing: thingText(eq.count, eq.thing) }) : '',
      ]
        .filter(Boolean)
        .join('\n')
      inform(t('session.finishedTitle'), body)
      router.back()
    })
  }

  function onDelete() {
    confirm(
      t('session.deleteTitle'),
      t('session.deleteBody'),
      t('common.delete'),
      async () => {
        if (active) timer.skip()
        await deleteSession(db, id)
        router.back()
      },
      { destructive: true },
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Stack.Screen
        options={{
          title: session.name,
          headerRight: active ? () => <Button compact variant="primary" label={t('session.finish')} onPress={onFinish} /> : undefined,
        }}
      />
      <Screen>
        <Muted>
          {formatLongDate(session.startedAt)} ·{' '}
          {active ? t('session.inProgress') : t('session.duration', { duration: formatDuration(session.finishedAt! - session.startedAt) })}
        </Muted>

        {session.exercises.map(e => (
          <ExerciseCard
            key={`${e.id}:${e.sets.map(s => s.id).join(',')}`}
            db={db}
            exercise={e}
            lastTime={lastTimes.get(e.exerciseId) ?? null}
            prefs={prefs}
            bodyweightKg={session.bodyweightKg}
            active={active}
            restSeconds={prefs.get(e.exerciseId)?.restS ?? profile.defaultRestS}
            onStructureChange={reload}
          />
        ))}

        <Button
          icon="add"
          label={t('session.addExercise')}
          onPress={() => router.push({ pathname: '/pick-exercise', params: { sessionId: String(id) } })}
        />
        {active ? <Button variant="primary" icon="checkmark-done" label={t('session.finish')} onPress={onFinish} /> : null}
        <Button variant="danger" icon="trash-outline" label={t('session.delete')} onPress={onDelete} style={{ marginTop: space[6] }} />
        {timer.state ? <View style={{ height: 90 }} /> : null}
      </Screen>
      <RestBar />
    </View>
  )
}

function thingText(count: number, thing: { one: string; many: string }): string {
  const n = roundCount(count)
  return n === 1 ? thing.one : `${formatNumber(n)} ${thing.many}`
}

interface SetValue {
  id: number
  weight: string
  reps: string
  doneAt: number | null
}

const toText = (n: number | null) => (n == null ? '' : formatNumber(n, 2))
const toPlanned = (v: SetValue): PlannedValue => ({ weightKg: parseDecimal(v.weight), reps: parseInteger(v.reps) })

function ExerciseCard({
  db,
  exercise,
  lastTime,
  prefs,
  bodyweightKg,
  active,
  restSeconds,
  onStructureChange,
}: {
  db: SQLiteDatabase
  exercise: SessionExercise
  lastTime: LastTime | null
  prefs: Map<string, ExercisePref>
  bodyweightKg: number | null
  active: boolean
  restSeconds: number
  onStructureChange: () => Promise<void>
}) {
  const timer = useRestTimer()
  const name = displayName(exercise.exerciseId, prefs)
  const bodyweight = exerciseIsBodyweight(exercise.exerciseId)
  const [values, setValues] = useState<SetValue[]>(() =>
    exercise.sets.map(s => ({ id: s.id, weight: toText(s.weightKg), reps: toText(s.reps), doneAt: s.doneAt })),
  )
  const lastSets = lastTime?.sets ?? []
  const todays = values.map(toPlanned)

  function persist(v: SetValue) {
    const p = toPlanned(v)
    void updateSet(db, v.id, { weightKg: p.weightKg, reps: p.reps, doneAt: v.doneAt })
  }

  // Cada canvi es desa a l'instant: si l'app es tanca a mitja sèrie, no es perd res.
  function change(index: number, patch: Partial<SetValue>) {
    const next = values.map((v, i) => (i === index ? { ...v, ...patch } : v))
    setValues(next)
    persist(next[index])
  }

  function toggleDone(index: number) {
    const v = values[index]
    if (v.doneAt) {
      change(index, { doneAt: null })
      return
    }
    // Sèrie buida: s'omple amb el valor suggerit (l'última vegada / la sèrie anterior).
    const s = suggestion(index, lastSets, todays)
    const weight = v.weight || (s?.weightKg != null ? toText(s.weightKg) : '')
    const reps = v.reps || (s?.reps != null ? toText(s.reps) : '')
    if (!parseInteger(reps)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
      return
    }
    change(index, { weight, reps, doneAt: timestamp() })
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    if (active) timer.start(restSeconds, name)
  }

  async function onAddSet() {
    await addSet(db, exercise.id)
    await onStructureChange()
  }

  function onRemoveSet() {
    const last = values[values.length - 1]
    if (!last) return
    const doRemove = async () => {
      await removeSet(db, last.id)
      await onStructureChange()
    }
    if (last.reps) {
      confirm(t('session.removeSet'), `${t('session.set')} ${values.length}: ${last.weight || 0} kg × ${last.reps}`, t('common.delete'), doRemove, {
        destructive: true,
      })
    } else void doRemove()
  }

  function onRemoveExercise() {
    const hasData = values.some(v => v.reps)
    const doRemove = async () => {
      await removeSessionExercise(db, exercise.id)
      await onStructureChange()
    }
    if (!hasData) {
      void doRemove()
      return
    }
    confirm(t('session.removeExerciseTitle', { name }), t('session.removeExerciseBody'), t('common.delete'), doRemove, {
      destructive: true,
    })
  }

  const lastText = lastTime
    ? t('session.last', {
        date: formatShortDate(lastTime.startedAt),
        sets: lastTime.sets.map(s => `${bodyweight && !s.weightKg ? 'PC' : formatNumber(s.weightKg ?? 0)}×${s.reps}`).join(' · '),
      })
    : t('session.noLast')

  return (
    <Card>
      <Row>
        <Pressable onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}>
          <ExerciseImage id={exercise.exerciseId} size={64} />
        </Pressable>
        <Pressable style={{ flex: 1, gap: 2 }} onPress={() => router.push(`/exercise/${exercise.exerciseId}`)}>
          <Body style={{ color: colors.heading, fontWeight: '700' }} numberOfLines={2}>
            {name}
          </Body>
          <Muted numberOfLines={2}>{lastText}</Muted>
        </Pressable>
        <IconButton icon="close" label={t('session.removeExercise')} onPress={onRemoveExercise} color={colors.muted} />
      </Row>

      {bodyweight ? (
        <Muted style={{ fontSize: fontSize.xs }}>
          {t('session.bodyweightHint')}
          {bodyweightKg ? ` (PC ${formatKg(bodyweightKg)})` : ''}
        </Muted>
      ) : null}

      <Row gap={space[2]} style={{ marginTop: space[1] }}>
        <Text style={[styles.colHead, styles.colIndex]}>#</Text>
        <Text style={[styles.colHead, styles.colInput]}>{bodyweight ? t('session.extraKg') : t('common.kg')}</Text>
        <Text style={[styles.colHead, styles.colInput]}>{t('common.reps')}</Text>
        <View style={styles.colCheck} />
      </Row>

      {values.map((v, i) => {
        const s = suggestion(i, lastSets, todays)
        const done = v.doneAt != null
        return (
          <Row key={v.id} gap={space[2]} style={[styles.setRow, done && { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.index, styles.colIndex, done && { color: colors.primarySoftFg }]}>{i + 1}</Text>
            <TextInput
              style={[styles.input, styles.colInput]}
              value={v.weight}
              onChangeText={text => change(i, { weight: text })}
              placeholder={s?.weightKg != null ? toText(s.weightKg) : bodyweight ? '0' : '–'}
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              selectTextOnFocus
              accessibilityLabel={`${t('session.set')} ${i + 1} kg`}
            />
            <TextInput
              style={[styles.input, styles.colInput]}
              value={v.reps}
              onChangeText={text => change(i, { reps: text.replace(/[^0-9]/g, '') })}
              placeholder={s?.reps != null ? String(s.reps) : '–'}
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              selectTextOnFocus
              accessibilityLabel={`${t('session.set')} ${i + 1} ${t('common.reps')}`}
            />
            <Pressable
              onPress={() => toggleDone(i)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={t('session.done')}
              style={[styles.check, styles.colCheck, done && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={22} color={done ? colors.onPrimary : colors.muted} />
            </Pressable>
          </Row>
        )
      })}

      <Row gap={space[2]} style={{ marginTop: space[1] }}>
        <Button compact icon="add" label={t('session.addSet')} onPress={onAddSet} style={{ flex: 1 }} />
        <Button compact icon="remove" label={t('session.removeSet')} onPress={onRemoveSet} style={{ flex: 1 }} disabled={values.length === 0} />
      </Row>
    </Card>
  )
}

const styles = StyleSheet.create({
  colHead: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  colIndex: { width: 28 },
  // flexBasis/minWidth 0: els camps es reparteixen l'amplada sense desbordar la fila.
  colInput: { flex: 1, flexBasis: 0, minWidth: 0 },
  colCheck: { width: 52 },
  setRow: { borderRadius: radius.control, paddingVertical: 2 },
  index: { color: colors.subtle, fontSize: fontSize.md, fontWeight: '700', textAlign: 'center' },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.heading,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 48,
    fontVariant: ['tabular-nums'],
  },
  check: {
    height: 48,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
