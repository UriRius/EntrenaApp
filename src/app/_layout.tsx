import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { ensureGifs } from '@/catalog/gif'
import { exercisesInUse } from '@/db/queries'
import { migrate } from '@/db/schema'
import { t } from '@/i18n'
import { RestTimerProvider } from '@/rest/RestTimer'
import { colors } from '@/theme/tokens'

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.canvas,
    card: colors.canvas,
    text: colors.heading,
    border: colors.line,
  },
}

/** En obrir l'app, descarrega els GIF que faltin (p. ex. si l'última vegada no hi havia connexió). */
function GifWarmup() {
  const db = useSQLiteContext()
  useEffect(() => {
    void exercisesInUse(db).then(ensureGifs)
  }, [db])
  return null
}

export default function RootLayout() {
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <SQLiteProvider databaseName="entrena.db" onInit={migrate}>
        <RestTimerProvider>
          <GifWarmup />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.canvas },
              headerTintColor: colors.heading,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.canvas },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="pick-exercise" options={{ title: t('picker.title'), presentation: 'modal' }} />
            <Stack.Screen name="routine/[id]" options={{ title: '' }} />
            <Stack.Screen name="session/[id]" options={{ title: '' }} />
            <Stack.Screen name="exercise/[id]" options={{ title: '' }} />
          </Stack>
        </RestTimerProvider>
      </SQLiteProvider>
    </ThemeProvider>
  )
}
