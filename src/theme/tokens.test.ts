import { describe, expect, it } from 'vitest'
import { colors, contrastRatio } from './tokens'

// Text petit: 4,5:1 (WCAG AA). Al gimnàs, amb llum dolenta i suor a la pantalla, no n'hi ha prou amb "a ull".
const TEXT_PAIRS: [string, keyof typeof colors, keyof typeof colors][] = [
  ['heading/canvas', 'heading', 'canvas'],
  ['body/surface', 'body', 'surface'],
  ['body/surface2', 'body', 'surface2'],
  ['subtle/surface', 'subtle', 'surface'],
  ['muted/canvas', 'muted', 'canvas'],
  ['muted/surface', 'muted', 'surface'],
  ['muted/surface2', 'muted', 'surface2'],
  ['onPrimary/primary', 'onPrimary', 'primary'],
  ['primary/surface', 'primary', 'surface'],
  ['primarySoftFg/primarySoft', 'primarySoftFg', 'primarySoft'],
  ['danger/surface', 'danger', 'surface'],
  ['warning/surface', 'warning', 'surface'],
  ['success/surface', 'success', 'surface'],
]

describe('contrast dels tokens', () => {
  it.each(TEXT_PAIRS)('%s ≥ 4,5:1', (_name, fg, bg) => {
    expect(contrastRatio(colors[fg] as string, colors[bg] as string)).toBeGreaterThanOrEqual(4.5)
  })
})
