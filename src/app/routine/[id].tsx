import { router, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'

import { displayName } from '@/catalog'
import {
  deleteRoutine,
  getPrefs,
  getRoutine,
  removeRoutineItem,
  renameRoutine,
  reorderRoutineItems,
  setRoutineItemSets,
} from '@/db/queries'
import { useData } from '@/hooks/useData'
import { t } from '@/i18n'
import { colors, space } from '@/theme/tokens'
import { Body, Button, Card, EmptyState, ExerciseImage, IconButton, Muted, Row, SavedField, Screen, Stepper } from '@/ui'
import { confirm } from '@/ui/dialogs'

export default function RoutineScreen() {
  const params = useLocalSearchParams<{ id: string; isNew?: string }>()
  const id = Number(params.id)
  const { data, reload, db } = useData(async d => ({ routine: await getRoutine(d, id), prefs: await getPrefs(d) }), id)

  const routine = data?.routine
  if (!data || !routine) return <Screen>{null}</Screen>

  async function saveName(text: string) {
    const clean = text.trim()
    if (!clean) return routine!.name // un nom buit es desfà
    if (clean !== routine!.name) {
      await renameRoutine(db, id, clean)
      await reload()
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const ids = routine!.items.map(i => i.id)
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    await reorderRoutineItems(db, ids)
    await reload()
  }

  function onDelete() {
    confirm(
      t('routine.deleteTitle', { name: routine!.name }),
      t('routine.deleteBody'),
      t('common.delete'),
      async () => {
        await deleteRoutine(db, id)
        router.back()
      },
      { destructive: true },
    )
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: routine.name }} />
      <SavedField
        key={routine.id}
        initial={routine.name}
        onSave={saveName}
        placeholder={t('routine.namePlaceholder')}
        autoFocus={params.isNew === '1'}
        selectTextOnFocus={params.isNew === '1'}
        returnKeyType="done"
        style={{ fontSize: 20, fontWeight: '700' }}
      />

      {routine.items.length === 0 ? <EmptyState icon="list-outline" text={t('routine.empty')} /> : null}

      {routine.items.map((item, index) => (
        <Card key={item.id} style={{ paddingVertical: space[3] }}>
          <Row>
            <ExerciseImage id={item.exerciseId} size={56} still />
            <View style={{ flex: 1, gap: 2 }}>
              <Body numberOfLines={2} style={{ fontWeight: '700', color: colors.heading }}>
                {displayName(item.exerciseId, data.prefs)}
              </Body>
              <Row gap={space[1]}>
                <Muted>{t('common.sets')}</Muted>
                <Stepper
                  value={item.sets}
                  onChange={async v => {
                    await setRoutineItemSets(db, item.id, v)
                    await reload()
                  }}
                />
              </Row>
            </View>
            <View style={{ gap: space[1] }}>
              <IconButton icon="chevron-up" label="Puja" onPress={() => move(index, -1)} color={index === 0 ? colors.faint : colors.subtle} />
              <IconButton
                icon="chevron-down"
                label="Baixa"
                onPress={() => move(index, 1)}
                color={index === routine.items.length - 1 ? colors.faint : colors.subtle}
              />
            </View>
            <IconButton
              icon="trash-outline"
              label={t('common.delete')}
              color={colors.danger}
              onPress={async () => {
                await removeRoutineItem(db, item.id)
                await reload()
              }}
            />
          </Row>
        </Card>
      ))}

      <Button
        icon="add"
        label={t('routine.addExercise')}
        variant="primary"
        onPress={() => router.push({ pathname: '/pick-exercise', params: { routineId: String(id) } })}
      />
      <Button icon="trash-outline" variant="danger" label={t('routine.delete')} onPress={onDelete} style={{ marginTop: space[8] }} />
    </Screen>
  )
}
