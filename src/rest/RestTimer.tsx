// Temporitzador de descans. Programa una notificació local per a l'hora d'acabar:
// vibra i sona encara que el mòbil estigui bloquejat o l'app en segon pla.
import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'

import { t } from '@/i18n'
import { formatClock } from '@/lib/format'
import { colors, fontSize, radius, space } from '@/theme/tokens'
import { Button, Row } from '@/ui'

const CHANNEL = 'rest'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

let setupDone: Promise<boolean> | null = null
/** Canal i permís, una sola vegada i només quan es fa servir el temporitzador per primer cop. */
function ensureNotifications(): Promise<boolean> {
  if (!setupDone) {
    setupDone = (async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync(CHANNEL, {
            name: t('rest.channel'),
            importance: AndroidImportance.HIGH,
            vibrationPattern: [0, 500, 250, 500],
            enableVibrate: true,
            sound: 'default',
          })
        }
        const current = await Notifications.getPermissionsAsync()
        if (current.granted) return true
        const asked = await Notifications.requestPermissionsAsync()
        return asked.granted
      } catch {
        return false
      }
    })()
  }
  return setupDone
}

interface TimerState {
  endsAt: number
  total: number
  label: string
}

interface RestTimerApi {
  state: TimerState | null
  start: (seconds: number, label: string) => void
  adjust: (deltaSeconds: number) => void
  skip: () => void
}

const Ctx = createContext<RestTimerApi | null>(null)

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState | null>(null)
  const notificationId = useRef<string | null>(null)

  const cancelNotification = useCallback(async () => {
    const id = notificationId.current
    notificationId.current = null
    if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
  }, [])

  const schedule = useCallback(
    async (next: TimerState) => {
      await cancelNotification()
      if (!(await ensureNotifications())) return
      if (next.endsAt <= Date.now()) return
      try {
        notificationId.current = await Notifications.scheduleNotificationAsync({
          content: {
            title: t('rest.notifTitle'),
            body: t('rest.notifBody', { name: next.label }),
            sound: 'default',
          },
          trigger: { type: SchedulableTriggerInputTypes.DATE, date: next.endsAt, channelId: CHANNEL },
        })
      } catch {
        // sense notificacions (p. ex. web): queda el compte enrere a la pantalla
      }
    },
    [cancelNotification],
  )

  const start = useCallback(
    (seconds: number, label: string) => {
      const next = { endsAt: Date.now() + seconds * 1000, total: seconds, label }
      setState(next)
      void schedule(next)
    },
    [schedule],
  )

  const adjust = useCallback(
    (delta: number) => {
      setState(prev => {
        if (!prev) return prev
        const endsAt = Math.max(Date.now(), prev.endsAt + delta * 1000)
        const next = { ...prev, endsAt, total: Math.max(1, prev.total + delta) }
        void schedule(next)
        return next
      })
    },
    [schedule],
  )

  const skip = useCallback(() => {
    setState(null)
    void cancelNotification()
  }, [cancelNotification])

  // Amb l'app oberta, en acabar: vibració i s'amaga.
  useEffect(() => {
    if (!state) return
    const ms = state.endsAt - Date.now()
    const timeout = setTimeout(
      () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
        notificationId.current = null
        setState(null)
      },
      Math.max(0, ms),
    )
    return () => clearTimeout(timeout)
  }, [state])

  const api = useMemo(() => ({ state, start, adjust, skip }), [state, start, adjust, skip])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useRestTimer(): RestTimerApi {
  const api = useContext(Ctx)
  if (!api) throw new Error('useRestTimer fora de RestTimerProvider')
  return api
}

/** Barra fixa a baix de la sessió mentre hi ha un descans en marxa. */
export function RestBar() {
  const { state, adjust, skip } = useRestTimer()
  const [tick, setTick] = useState<{ endsAt: number; remaining: number } | null>(null)

  useEffect(() => {
    if (!state) return
    const update = () => setTick({ endsAt: state.endsAt, remaining: Math.max(0, (state.endsAt - Date.now()) / 1000) })
    const first = setTimeout(update, 0)
    const i = setInterval(update, 250)
    return () => {
      clearTimeout(first)
      clearInterval(i)
    }
  }, [state])

  if (!state) return null
  // Fins al primer tic d'aquest temporitzador, el temps sencer.
  const remaining = tick && tick.endsAt === state.endsAt ? tick.remaining : state.total
  const progress = state.total > 0 ? Math.min(1, remaining / state.total) : 0

  return (
    <View style={styles.bar}>
      <View style={[styles.progress, { width: `${progress * 100}%` }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.label}>{t('rest.label')}</Text>
          <Text style={styles.clock}>{formatClock(remaining)}</Text>
        </View>
        <Row gap={space[2]}>
          <Button compact label="−15" onPress={() => adjust(-15)} />
          <Button compact label="+15" onPress={() => adjust(15)} />
          <Button compact variant="primary" label={t('rest.skip')} onPress={skip} />
        </Row>
      </Row>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: space[3],
    right: space[3],
    bottom: space[3],
    backgroundColor: colors.surface3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: space[3],
    overflow: 'hidden',
  },
  progress: { position: 'absolute', left: 0, top: 0, height: 3, backgroundColor: colors.primary },
  label: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  clock: { color: colors.heading, fontSize: fontSize.xxl, fontWeight: '800', fontVariant: ['tabular-nums'] },
})
