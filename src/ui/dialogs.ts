// Diàlegs. A Android fan servir Alert natiu; a web (proves al navegador), confirm/alert del navegador,
// perquè Alert.alert de React Native Web no mostra res.
import { Alert, Platform } from 'react-native'

import { t } from '@/i18n'

export function confirm(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => unknown,
  opts: { destructive?: boolean } = {},
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) void onConfirm()
    return
  }
  Alert.alert(title, message, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: confirmLabel, style: opts.destructive ? 'destructive' : 'default', onPress: () => void onConfirm() },
  ])
}

export function inform(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`)
    return
  }
  Alert.alert(title, message)
}
