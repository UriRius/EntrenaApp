import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { View } from 'react-native'

import { displayName } from '@/catalog'
import { createRoutine, getActiveSession, getPrefs, listRoutines, startSession } from '@/db/queries'
import { timestamp, useData } from '@/hooks/useData'
import { t } from '@/i18n'
import { formatDuration, formatShortDate } from '@/lib/format'
import { colors, space } from '@/theme/tokens'
import { Body, Button, Card, EmptyState, ExerciseImage, Heading, Muted, Row, Screen, SectionLabel } from '@/ui'
import { inform } from '@/ui/dialogs'

export default function TrainScreen() {
  const { data, db } = useData(
    async d => ({
      active: await getActiveSession(d),
      routines: await listRoutines(d),
      prefs: await getPrefs(d),
      loadedAt: timestamp(),
    }),
  )

  if (!data) return <Screen>{null}</Screen>
  const { active, routines, prefs } = data

  async function onStart(routineId: number, exerciseCount: number) {
    if (active) {
      inform(t('train.alreadyActiveTitle'), t('train.alreadyActiveBody', { name: active.name }))
      return
    }
    if (exerciseCount === 0) {
      inform(t('train.emptyRoutineTitle'), t('train.emptyRoutineBody'))
      return
    }
    const id = await startSession(db, routineId)
    router.push(`/session/${id}`)
  }

  async function onNew() {
    const id = await createRoutine(db, t('routine.newName'))
    router.push({ pathname: '/routine/[id]', params: { id: String(id), isNew: '1' } })
  }

  return (
    <Screen>
      {active ? (
        <Card onPress={() => router.push(`/session/${active.id}`)} style={{ borderColor: colors.primary }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Muted style={{ color: colors.primary, fontWeight: '700' }}>{t('train.activeTitle').toUpperCase()}</Muted>
              <Heading>{active.name}</Heading>
              <Muted>{t('train.activeSince', { duration: formatDuration(data.loadedAt - active.startedAt) })}</Muted>
            </View>
            <Button variant="primary" label={t('train.activeContinue')} onPress={() => router.push(`/session/${active.id}`)} />
          </Row>
        </Card>
      ) : null}

      <SectionLabel>{t('train.routines')}</SectionLabel>

      {routines.length === 0 ? <EmptyState icon="barbell-outline" text={t('train.empty')} /> : null}

      {routines.map(r => (
        <Card key={r.id} onPress={() => router.push(`/routine/${r.id}`)}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Heading>{r.name}</Heading>
              <Muted>
                {r.exerciseIds.length === 0
                  ? t('train.noExercises')
                  : r.exerciseIds.length === 1
                    ? t('train.exerciseCountOne')
                    : t('train.exerciseCount', { n: r.exerciseIds.length })}
                {r.lastDoneAt ? ` · ${t('train.lastDone', { date: formatShortDate(r.lastDoneAt) })}` : ''}
              </Muted>
            </View>
            <Ionicons name="create-outline" size={20} color={colors.muted} />
          </Row>
          {r.exerciseIds.length > 0 ? (
            <Row gap={space[2]} style={{ flexWrap: 'wrap' }}>
              {r.exerciseIds.slice(0, 5).map((id, i) => (
                <ExerciseImage key={`${id}-${i}`} id={id} size={44} still />
              ))}
            </Row>
          ) : null}
          {r.exerciseIds.length > 0 ? (
            <Body numberOfLines={2} style={{ color: colors.subtle, fontSize: 14 }}>
              {r.exerciseIds.map(id => displayName(id, prefs)).join(' · ')}
            </Body>
          ) : null}
          <Button
            variant={active ? 'secondary' : 'primary'}
            icon="play"
            label={t('train.start')}
            onPress={() => onStart(r.id, r.exerciseIds.length)}
            style={{ marginTop: space[1] }}
          />
        </Card>
      ))}

      <Button icon="add" label={t('train.newRoutine')} onPress={onNew} />
    </Screen>
  )
}
