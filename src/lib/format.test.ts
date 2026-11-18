import { describe, expect, it } from 'vitest'
import {
  formatClock,
  formatDuration,
  formatKg,
  formatLongDate,
  formatNumber,
  formatShortDate,
  monthWithDe,
  parseDecimal,
  parseInteger,
} from './format'

describe('formatNumber', () => {
  it('separador de milers amb punt i decimals amb coma', () => {
    expect(formatNumber(1234.5)).toBe('1.234,5')
    expect(formatNumber(1234567)).toBe('1.234.567')
    expect(formatNumber(62.5)).toBe('62,5')
    expect(formatNumber(60)).toBe('60')
    expect(formatNumber(0.04)).toBe('0')
    expect(formatNumber(2.25, 2)).toBe('2,25')
  })
  it('kg', () => {
    expect(formatKg(12340)).toBe('12.340 kg')
  })
})

describe('parse', () => {
  it('accepta coma o punt', () => {
    expect(parseDecimal('62,5')).toBe(62.5)
    expect(parseDecimal(' 60 ')).toBe(60)
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('-5')).toBeNull()
  })
  it('enters', () => {
    expect(parseInteger('10')).toBe(10)
    expect(parseInteger('10.5')).toBeNull()
    expect(parseInteger('')).toBeNull()
  })
})

describe('dates', () => {
  it('apòstrof davant de vocal', () => {
    expect(monthWithDe(3)).toBe("d'abril")
    expect(monthWithDe(7)).toBe("d'agost")
    expect(monthWithDe(9)).toBe("d'octubre")
    expect(monthWithDe(10)).toBe('de novembre')
  })
  it('data curta i llarga', () => {
    const ts = new Date(2026, 10, 9, 10).getTime()
    expect(formatShortDate(ts, ts)).toBe('dl. 9 nov.')
    expect(formatShortDate(new Date(2025, 9, 1).getTime(), ts)).toBe('dc. 1 oct. 2025')
    expect(formatLongDate(ts)).toBe('dilluns, 9 de novembre de 2026')
  })
})

describe('durades', () => {
  it('minuts i hores', () => {
    expect(formatDuration(45 * 60000)).toBe('45 min')
    expect(formatDuration(65 * 60000)).toBe('1 h 05 min')
  })
  it('rellotge', () => {
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(0.2)).toBe('0:01')
    expect(formatClock(-3)).toBe('0:00')
  })
})
