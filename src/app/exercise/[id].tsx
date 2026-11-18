import { Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'

import { displayName, getExercise } from '@/catalog'
import { getPrefs, getProfile, setCustomName, setExerciseRest, setRows } from '@/db/queries'
import { useData } from '@/hooks/useData'
import { t } from '@/i18n'
import { BODY_PARTS, EQUIPMENTS, MUSCLES, isBodyweight, label } from '@/lib/catalog'
import { formatKg, formatNumber, formatShortDate } from '@/lib/format'
import { progressMetric, progressSeries, records, volume, type SetRow } from '@/lib/stats'
import { colors, space } from '@/theme/tokens'
import { Body, Button, Card, ExerciseImage, Muted, Row, SavedField, Screen, SectionLabel, Stat, Stepper } from '@/ui'
import { LineChart } from '@/ui/LineChart'

export default function ExerciseScreen() {
  const id = useLocalSearchParams<{ id: string }>().id
  const exercise = getExercise(id)
  const bodyweight = isBodyweight(exercise)
  const { data, reload, db } = useData(
    async d => {
      const prefs = await getPrefs(d)
      return {
        prefs,
        pref: prefs.get(id),
        profile: await getProfile(d),
        rows: await setRows(d, () => bodyweight, { exerciseId: id }),
      }
    },
    id,
  )
  const [showInstructions, setShowInstructions] = useState(false)

  if (!data) return <Screen>{null}</Screen>
  const { pref, profile, rows } = data
  const rec = records(rows)
  const vol = volume(rows)
  const metric = progressMetric(rows, bodyweight)
  const series = progressSeries(rows, metric)
  const restS = pref?.restS ?? null

  async function saveName(text: string) {
    await setCustomName(db, id, text)
    await reload()
  }

  async function changeRest(v: number | null) {
    await setExerciseRest(db, id, v)
    await reload()
  }

  // Últimes sessions: sèries agrupades per sessió, de més nova a més antiga.
  const bySession = new Map<number, SetRow[]>()
  for (const r of rows) bySession.set(r.sessionId, [...(bySession.get(r.sessionId) ?? []), r])
  const recent = [...bySession.values()].reverse().slice(0, 5)
  const setText = (r: SetRow) => `${bodyweight && !r.weightKg ? 'PC' : formatNumber(r.weightKg ?? 0)}×${r.reps}`

  return (
    <Screen>
      <Stack.Screen options={{ title: displayName(id, data.prefs) }} />
      <View style={{ alignItems: 'center' }}>
        <ExerciseImage id={id} size={260} />
      </View>

      <SectionLabel>{t('exercise.rename')}</SectionLabel>
      <SavedField key={id} initial={pref?.customName ?? ''} onSave={saveName} placeholder={t('exercise.renamePlaceholder')} />
      <Muted>{t('exercise.original', { name: exercise.name })}</Muted>

      <SectionLabel>{t('exercise.records')}</SectionLabel>
      {rows.length === 0 ? (
        <Muted>{t('exercise.noData')}</Muted>
      ) : (
        <Card>
          <Row style={{ alignItems: 'flex-start' }}>
            {rec.best && (!bodyweight || rec.best.weightKg > 0) ? (
              <Stat
                accent
                value={`${formatNumber(rec.best.weightKg)} kg × ${rec.best.reps}`}
                label={`${t('exercise.bestSet')} · ${formatShortDate(rec.best.at)}`}
              />
            ) : null}
            {rec.maxReps ? <Stat value={String(rec.maxReps.reps)} label={`${t('exercise.maxReps')} · ${formatShortDate(rec.maxReps.at)}`} /> : null}
          </Row>
          <Row style={{ alignItems: 'flex-start', marginTop: space[2] }}>
            {rec.bestOneRepMax ? <Stat value={formatKg(rec.bestOneRepMax.valueKg, 0)} label={`${t('exercise.oneRm')} *`} /> : null}
            <Stat value={formatKg(vol.totalKg, 0)} label={t('exercise.totalVolume')} />
          </Row>
          {rec.bestOneRepMax ? <Muted style={{ fontSize: 12 }}>* {t('exercise.oneRmNote')}</Muted> : null}
        </Card>
      )}

      {rows.length > 0 ? (
        <>
          <SectionLabel>{metric === 'weight' ? t('exercise.chartWeight') : t('exercise.chartReps')}</SectionLabel>
          <Card>{series.length >= 2 ? <LineChart points={series} /> : <Muted>{t('exercise.chartNeedMore')}</Muted>}</Card>

          <SectionLabel>{t('exercise.recent')}</SectionLabel>
          <Card>
            {recent.map(sets => (
              <Row key={sets[0].sessionId} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Muted style={{ width: 92 }}>{formatShortDate(sets[0].startedAt)}</Muted>
                <Body style={{ flex: 1, fontVariant: ['tabular-nums'] }}>{sets.map(setText).join(' · ')}</Body>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <SectionLabel>{t('exercise.rest')}</SectionLabel>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stepper
            value={restS ?? profile.defaultRestS}
            min={15}
            max={600}
            step={15}
            format={v => `${v} s`}
            onChange={v => changeRest(v)}
          />
          {restS != null ? (
            <Button compact variant="ghost" label={t('exercise.restDefault', { s: profile.defaultRestS })} onPress={() => changeRest(null)} />
          ) : (
            <Muted>{t('exercise.restDefault', { s: profile.defaultRestS })}</Muted>
          )}
        </Row>
      </Card>

      <SectionLabel>{t('exercise.muscles')}</SectionLabel>
      <Body>
        {exercise.targetMuscles.map(m => label(MUSCLES, m)).join(', ')}
        {exercise.secondaryMuscles.length ? (
          <Body style={{ color: colors.muted }}> · {exercise.secondaryMuscles.map(m => label(MUSCLES, m)).join(', ')}</Body>
        ) : null}
      </Body>
      <Muted>
        {exercise.bodyParts.map(b => label(BODY_PARTS, b)).join(', ')} · {t('exercise.equipment')}:{' '}
        {exercise.equipments.map(e => label(EQUIPMENTS, e)).join(', ')}
      </Muted>

      {exercise.instructions.length > 0 ? (
        <>
          <Button
            variant="ghost"
            icon={showInstructions ? 'chevron-up' : 'chevron-down'}
            label={t('exercise.instructions')}
            onPress={() => setShowInstructions(s => !s)}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
          />
          {showInstructions
            ? exercise.instructions.map((step, i) => (
                <Body key={i} style={{ color: colors.subtle }}>
                  {i + 1}. {step}
                </Body>
              ))
            : null}
        </>
      ) : null}
    </Screen>
  )
}
