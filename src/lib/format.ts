// Formats en català. Un sol lloc per a cada format: cap pantalla formata pel seu compte.
// Sense Intl (Hermes a Android no el porta complet): format manual i provat.

/** 1234.5 → "1.234,5"; arrodoneix a `decimals` i treu els zeros finals. */
export function formatNumber(n: number, decimals = 1): string {
  const factor = 10 ** decimals
  const rounded = Math.round(n * factor) / factor
  const negative = rounded < 0
  const [int, frac] = Math.abs(rounded).toFixed(decimals).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const fracTrimmed = frac ? frac.replace(/0+$/, '') : ''
  return `${negative ? '-' : ''}${grouped}${fracTrimmed ? `,${fracTrimmed}` : ''}`
}

/** "1.234,5 kg" */
export function formatKg(n: number, decimals = 1): string {
  return `${formatNumber(n, decimals)} kg`
}

/** Llegeix un número escrit a mà ("62,5", "62.5", " 60 ") → 62.5; buit o invàlid → null. */
export function parseDecimal(text: string): number | null {
  const clean = text.trim().replace(',', '.')
  if (clean === '') return null
  const n = Number(clean)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Enters positius ("10") → 10; buit o invàlid → null. */
export function parseInteger(text: string): number | null {
  const clean = text.trim()
  if (!/^\d+$/.test(clean)) return null
  return Number(clean)
}

const MONTHS_SHORT = ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny', 'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.']
const MONTHS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre']
const WEEKDAYS = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte']
const WEEKDAYS_SHORT = ['dg.', 'dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.']

/** "de novembre" / "d'octubre" (apòstrof davant de vocal). */
export function monthWithDe(month: number): string {
  const name = MONTHS[month]
  return /^[aeiouàèéíòóú]/i.test(name) ? `d'${name}` : `de ${name}`
}

export function monthName(month: number): string {
  return MONTHS[month]
}

/** "dl. 3 nov." (any inclòs si no és l'any de `now`). */
export function formatShortDate(ts: number, now = Date.now()): string {
  const d = new Date(ts)
  const year = d.getFullYear() !== new Date(now).getFullYear() ? ` ${d.getFullYear()}` : ''
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${year}`
}

/** "dilluns, 3 de novembre de 2026" */
export function formatLongDate(ts: number): string {
  const d = new Date(ts)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${monthWithDe(d.getMonth())} de ${d.getFullYear()}`
}

/** "novembre de 2026" (capçalera de grup de l'historial). */
export function formatMonthYear(ts: number): string {
  const d = new Date(ts)
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

/** Durada en minuts → "45 min", "1 h 05 min". */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return `${h} h ${String(m).padStart(2, '0')} min`
}

/** Segons → "1:05" (temporitzador). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
