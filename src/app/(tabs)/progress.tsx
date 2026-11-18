import { router } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'

import { displayName, exerciseIsBodyweight } from '@/catalog'
import { getPrefs, setRows } from '@/db/queries'
import { timestamp, useData } from '@/hooks/useData'
import { t } from '@/i18n'
import { equivalence, roundCount } from '@/lib/equivalences'
import { formatKg, formatNumber } from '@/lib/format'
import { periodStart, records, volume, type Period, type SetRow } from '@/lib/stats'
import { colors, fontSize, space } from '@/theme/tokens'
import { Body, Card, Chip, EmptyState, ExerciseImage, Muted, Row, Screen, SectionLabel } from '@/ui'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'month', label: t('progress.month') },
  { key: 'year', label: t('progress.year') },
  { key: 'all', label: t('progress.all') },
]

export default function ProgressScreen() {
  const [period, setPeriod] = useState<Period>('month')
  const { data } = useData(async d => ({
    rows: await setRows(d, exerciseIsBodyweight),
    prefs: await getPrefs(d),
    loadedAt: timestamp(),
  }))

  if (!data) return <Screen>{null}</Screen>
  if (data.rows.length === 0)
    return (
      <Screen>
        <EmptyState icon="stats-chart" text={t('progress.empty')} />
      </Screen>
    )

  const since = periodStart(period, data.loadedAt)
  const inPeriod = data.rows.filter(r => r.startedAt >= since)
  const total = volume(inPeriod)
  const eq = equivalence(total.totalKg)

  // Exercicis del període, de més a menys pes mogut.
  const byExercise = new Map<string, SetRow[]>()
  for (const r of inPeriod) byExercise.set(r.exerciseId, [...(byExercise.get(r.exerciseId) ?? []), r])
  const exercises = [...byExercise.entries()]
    .map(([id, rows]) => ({ id, vol: volume(rows), rec: records(rows), bodyweight: rows[0].isBodyweight }))
    .sort((a, b) => b.vol.totalKg - a.vol.totalKg)

  return (
    <Screen>
      <Row gap={space[2]}>
        {PERIODS.map(p => (
          <Chip key={p.key} label={p.label} selected={period === p.key} onPress={() => setPeriod(p.key)} />
        ))}
      </Row>

      <Card style={{ paddingVertical: space[6] }}>
        <Muted>{t('progress.question')}</Muted>
        <Text style={{ color: colors.primary, fontSize: fontSize.huge, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatKg(total.totalKg, 0)}
        </Text>
        {eq ? (
          <Body style={{ fontSize: fontSize.lg, color: colors.heading, fontWeight: '600' }}>
            {t('progress.equivalence', {
              thing: roundCount(eq.count) === 1 ? eq.thing.one : `${formatNumber(roundCount(eq.count))} ${eq.thing.many}`,
            })}{' '}
            💪
          </Body>
        ) : null}
        <Muted>{t('progress.sessions', { n: total.sessions, sets: total.sets, reps: formatNumber(total.reps) })}</Muted>
      </Card>
      <Muted style={{ fontSize: fontSize.xs }}>{t('progress.howCalculated')}</Muted>
      {total.setsMissingBodyweight > 0 ? (
        <Muted style={{ fontSize: fontSize.xs, color: colors.warning }}>
          {t('progress.missingBodyweight', { n: total.setsMissingBodyweight })}
        </Muted>
      ) : null}

      {exercises.length > 0 ? <SectionLabel>{t('progress.exercises')}</SectionLabel> : null}
      {exercises.length === 0 ? <Muted>{t('progress.empty')}</Muted> : null}
      {exercises.map(e => {
        const best = e.rec.best
        const bestText = best
          ? e.bodyweight && best.weightKg === 0
            ? `${e.rec.maxReps?.reps} ${t('common.reps')}`
            : `${formatNumber(best.weightKg)} kg × ${best.reps}`
          : '–'
        return (
          <Card key={e.id} onPress={() => router.push(`/exercise/${e.id}`)} style={{ paddingVertical: space[3] }}>
            <Row>
              <ExerciseImage id={e.id} size={48} still />
              <View style={{ flex: 1, gap: 2 }}>
                <Body numberOfLines={1} style={{ color: colors.heading, fontWeight: '700' }}>
                  {displayName(e.id, data.prefs)}
                </Body>
                <Muted>{t('progress.exerciseLine', { best: bestText, volume: formatKg(e.vol.totalKg, 0) })}</Muted>
              </View>
            </Row>
          </Card>
        )
      })}
    </Screen>
  )
}
