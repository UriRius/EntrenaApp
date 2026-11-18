import { router } from 'expo-router'
import { View } from 'react-native'

import { exerciseIsBodyweight } from '@/catalog'
import { listSessions, setRows } from '@/db/queries'
import { useData } from '@/hooks/useData'
import { t } from '@/i18n'
import { formatDuration, formatKg, formatMonthYear, formatShortDate } from '@/lib/format'
import { volume } from '@/lib/stats'
import { colors } from '@/theme/tokens'
import { Card, EmptyState, Heading, Muted, Row, Screen, SectionLabel } from '@/ui'

export default function HistoryScreen() {
  const { data } = useData(
    async d => {
      const sessions = await listSessions(d)
      const rows = await setRows(d, exerciseIsBodyweight)
      return sessions.map(s => {
        const v = volume(rows.filter(r => r.sessionId === s.id))
        return { ...s, sets: v.sets, volumeKg: v.totalKg }
      })
    },
  )

  if (!data) return <Screen>{null}</Screen>
  if (data.length === 0)
    return (
      <Screen>
        <EmptyState icon="calendar-outline" text={t('history.empty')} />
      </Screen>
    )

  return (
    <Screen>
      {data.map((s, i) => {
        const month = formatMonthYear(s.startedAt)
        const header = i === 0 || month !== formatMonthYear(data[i - 1].startedAt) ? month : null
        return (
          <View key={s.id} style={{ gap: 8 }}>
            {header ? <SectionLabel>{header}</SectionLabel> : null}
            <Card onPress={() => router.push(`/session/${s.id}`)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Heading numberOfLines={1} style={{ flex: 1 }}>
                  {s.name}
                </Heading>
                <Muted style={s.finishedAt ? undefined : { color: colors.primary, fontWeight: '700' }}>
                  {s.finishedAt ? formatDuration(s.finishedAt - s.startedAt) : t('session.inProgress')}
                </Muted>
              </Row>
              <Muted>
                {formatShortDate(s.startedAt)} ·{' '}
                {t('history.summary', { exercises: s.exerciseCount, sets: s.sets, volume: formatKg(s.volumeKg, 0) })}
              </Muted>
            </Card>
          </View>
        )
      })}
    </Screen>
  )
}
