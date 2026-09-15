export type TimeUnit = 'seconds' | 'milliseconds'

export function parseTimestamp(text: string, unit: TimeUnit): number | null {
  const t = text.trim()
  if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return null
  const n = Number(t)
  const ms = unit === 'seconds' ? n * 1000 : n
  return Number.isFinite(ms) ? ms : null
}

export function formatTimestamp(ms: number, unit: TimeUnit): string {
  return unit === 'seconds' ? String(Math.round(ms / 1000)) : String(Math.round(ms))
}

export function parseIso(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d.getTime()
}

export function formatIso(ms: number): string {
  return new Date(ms).toISOString()
}

// <input type="datetime-local"> always parses/serializes as local time (no
// timezone suffix), which is exactly what new Date(string) treats a
// timezone-less date-time string as too — so this round-trips correctly.
export function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function fromDatetimeLocalValue(text: string): number | null {
  if (!text) return null
  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? null : d.getTime()
}

const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

export function formatRelative(ms: number, now = Date.now()): string {
  const diffSeconds = (ms - now) / 1000
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return RTF.format(Math.round(diffSeconds / secondsInUnit), unit)
    }
  }
  return RTF.format(0, 'second')
}
