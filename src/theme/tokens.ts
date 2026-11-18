// Tokens de disseny semàntics (plantilla app-playbook, adaptada).
//
// Regles:
//  * Les pantalles NO fan servir mai un color cru: només aquests noms, que diuen
//    la FEINA del color (surface, body, primary…). Canviar la identitat és
//    canviar aquest fitxer.
//  * L'app és fosca per decisió (estètica de gimnàs). Si algun dia cal mode
//    clar, s'afegeix un segon objecte `light` amb les mateixes claus.
//  * Fitxer pur (sense React Native): el test de contrast el llegeix amb Vitest.

export interface ColorTokens {
  canvas: string
  surface: string
  surface2: string
  surface3: string
  line: string
  lineStrong: string
  heading: string
  body: string
  subtle: string
  muted: string
  faint: string // només icones i vores, mai text
  primary: string // accent ple (botó principal, sèrie feta); com a molt un element ple per vista
  onPrimary: string
  primarySoft: string
  primarySoftFg: string
  success: string
  warning: string
  danger: string
  /** Fons darrere dels GIF d'ExerciseDB, que són sobre blanc: evita vores fosques. */
  imageBackdrop: string
  chart: { line: string; point: string; grid: string; axis: string }
}

export const colors: ColorTokens = {
  canvas: '#0D0E10',
  surface: '#16181B',
  surface2: '#1E2125',
  surface3: '#292D32',
  line: '#2A2E33',
  lineStrong: '#3B4047',
  heading: '#F5F6F7',
  body: '#E1E3E6',
  subtle: '#B0B5BC',
  muted: '#8C929A',
  faint: '#5C626A',
  primary: '#C5F04A', // llima elèctrica
  onPrimary: '#0D0E10',
  primarySoft: '#232C10',
  primarySoftFg: '#D9F78A',
  success: '#5FD38A',
  warning: '#F5A524',
  danger: '#F27070',
  imageBackdrop: '#FFFFFF',
  chart: { line: '#C5F04A', point: '#D9F78A', grid: '#2A2E33', axis: '#8C929A' },
}

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const
export const radius = { control: 10, card: 14, pill: 999 } as const
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, huge: 40 } as const

// --- Contrast WCAG: mesurat, no a ull -----------------------------------------
function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
/** Ràtio de contrast WCAG entre dos colors #RRGGBB (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
