import { ca, type TextKey } from './ca'

/** t('train.exerciseCount', { n: 3 }) → "3 exercicis" */
export function t(key: TextKey, params?: Record<string, string | number>): string {
  const text: string = ca[key]
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

export type { TextKey }
