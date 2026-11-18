import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router/js-tabs'
import type { ColorValue } from 'react-native'

import { t } from '@/i18n'
import { colors } from '@/theme/tokens'
import type { IconName } from '@/ui'

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <Ionicons name={name} size={size} color={color as string} />
}

function icon(name: IconName) {
  return function Icon({ color, size }: { color: ColorValue; size: number }) {
    return <TabIcon name={name} color={color} size={size} />
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontWeight: '600' },
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.heading,
        headerTitleStyle: { fontWeight: '800', fontSize: 22 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tab.train'), tabBarIcon: icon('barbell') }} />
      <Tabs.Screen name="history" options={{ title: t('tab.history'), tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="progress" options={{ title: t('tab.progress'), tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab.profile'), tabBarIcon: icon('person-outline') }} />
    </Tabs>
  )
}
