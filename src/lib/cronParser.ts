export interface CronField {
  values: number[] // expanded, sorted, deduped, within [min, max]
  isWildcard: boolean
  stepFromWildcard: number | null // set only if the whole field is exactly */N
  singleValue: number | null // set only if the whole field is exactly one plain value
}

export interface ParsedCron {
  minute: CronField
  hour: CronField
  dayOfMonth: CronField
  month: CronField
  dayOfWeek: CronField
  domRestricted: boolean
  dowRestricted: boolean
}

export interface CronParseResult {
  parsed: ParsedCron | null
  error: string | null
  isReboot: boolean
}

const SHORTHANDS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
// Index 0 is an unused placeholder so this lines up directly with cron's
// 1-indexed month field (1 = January) — avoids an off-by-one at every call site.
export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_ABBR = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function rangeArray(min: number, max: number): number[] {
  const out: number[] = []
  for (let v = min; v <= max; v++) out.push(v)
  return out
}

function substituteNames(expr: string, names: string[], nameBase: number): string {
  return expr.replace(/[a-zA-Z]+/g, (word) => {
    const idx = names.indexOf(word.toLowerCase())
    return idx === -1 ? word : String(nameBase + idx)
  })
}

function parseField(rawExpr: string, min: number, max: number): CronField | { error: string } {
  const expr = rawExpr.trim()
  if (expr === '') return { error: 'Empty field' }

  if (expr === '*') {
    return { values: rangeArray(min, max), isWildcard: true, stepFromWildcard: null, singleValue: null }
  }

  const wildcardStep = /^\*\/(\d+)$/.exec(expr)
  if (wildcardStep) {
    const step = Number(wildcardStep[1])
    if (step <= 0) return { error: `Invalid step "${expr}"` }
    const values = rangeArray(min, max).filter((v) => (v - min) % step === 0)
    return { values, isWildcard: false, stepFromWildcard: step, singleValue: null }
  }

  const parts = expr.split(',')
  const valueSet = new Set<number>()
  for (const part of parts) {
    const m = /^(\*|\d+)(-(\d+))?(\/(\d+))?$/.exec(part)
    if (!m) return { error: `Couldn't parse "${part}"` }
    const isStar = m[1] === '*'
    const rangeStart = isStar ? min : Number(m[1])
    const rangeEnd = m[3] !== undefined ? Number(m[3]) : isStar ? max : rangeStart
    const step = m[5] !== undefined ? Number(m[5]) : 1
    if (rangeStart < min || rangeEnd > max || rangeStart > rangeEnd || step <= 0) {
      return { error: `"${part}" is out of range (expected ${min}-${max})` }
    }
    for (let v = rangeStart; v <= rangeEnd; v += step) valueSet.add(v)
  }

  const values = [...valueSet].sort((a, b) => a - b)
  const singleValue =
    parts.length === 1 && /^\d+$/.test(parts[0]) ? Number(parts[0]) : null

  return { values, isWildcard: false, stepFromWildcard: null, singleValue }
}

function normalizeDayOfWeek(field: CronField): CronField {
  const values = [...new Set(field.values.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b)
  const singleValue = field.singleValue === 7 ? 0 : field.singleValue
  return { ...field, values, singleValue }
}

export function parseCron(input: string): CronParseResult {
  const trimmed = input.trim()
  if (!trimmed) return { parsed: null, error: null, isReboot: false }

  if (trimmed === '@reboot') return { parsed: null, error: null, isReboot: true }

  const expanded = SHORTHANDS[trimmed.toLowerCase()] ?? trimmed
  const fields = expanded.split(/\s+/)
  if (fields.length !== 5) {
    return {
      parsed: null,
      error: `Expected 5 fields (minute hour day-of-month month day-of-week), found ${fields.length}.`,
      isReboot: false,
    }
  }

  const [minuteExpr, hourExpr, domExpr, monthExprRaw, dowExprRaw] = fields
  const monthExpr = substituteNames(monthExprRaw, MONTH_ABBR, 1)
  const dowExpr = substituteNames(dowExprRaw, DAY_ABBR, 0)

  const minute = parseField(minuteExpr, 0, 59)
  if ('error' in minute) return { parsed: null, error: `Minute field: ${minute.error}`, isReboot: false }
  const hour = parseField(hourExpr, 0, 23)
  if ('error' in hour) return { parsed: null, error: `Hour field: ${hour.error}`, isReboot: false }
  const dayOfMonth = parseField(domExpr, 1, 31)
  if ('error' in dayOfMonth) return { parsed: null, error: `Day-of-month field: ${dayOfMonth.error}`, isReboot: false }
  const month = parseField(monthExpr, 1, 12)
  if ('error' in month) return { parsed: null, error: `Month field: ${month.error}`, isReboot: false }
  const dowRaw = parseField(dowExpr, 0, 7)
  if ('error' in dowRaw) return { parsed: null, error: `Day-of-week field: ${dowRaw.error}`, isReboot: false }
  const dayOfWeek = normalizeDayOfWeek(dowRaw)

  return {
    parsed: {
      minute,
      hour,
      dayOfMonth,
      month,
      dayOfWeek,
      domRestricted: !dayOfMonth.isWildcard,
      dowRestricted: !dayOfWeek.isWildcard,
    },
    error: null,
    isReboot: false,
  }
}

// --- Plain-English description ------------------------------------------

function formatList(items: string[]): string {
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function joinValues(values: number[], names?: string[]): string {
  return formatList(values.map((v) => (names ? names[v] : String(v))))
}

function timeClause(minute: CronField, hour: CronField): string {
  if (minute.singleValue !== null && hour.singleValue !== null) {
    const hh = String(hour.singleValue).padStart(2, '0')
    const mm = String(minute.singleValue).padStart(2, '0')
    return `At ${hh}:${mm}`
  }
  if (minute.isWildcard && hour.isWildcard) return 'Every minute'
  if (minute.stepFromWildcard && hour.isWildcard) return `Every ${minute.stepFromWildcard} minutes`
  if (minute.singleValue !== null && hour.isWildcard) {
    return `At minute ${minute.singleValue} past every hour`
  }
  if (minute.isWildcard && hour.singleValue !== null) {
    return `Every minute past hour ${hour.singleValue}`
  }
  if (minute.singleValue !== null && hour.stepFromWildcard) {
    return `At minute ${minute.singleValue} past every ${hour.stepFromWildcard} hours`
  }
  if (minute.isWildcard && hour.stepFromWildcard) {
    return `Every minute, every ${hour.stepFromWildcard} hours`
  }
  // Fallback for anything more elaborate (lists, ranges, range/step): always
  // correct, just more literal than the natural-language special cases above.
  const minutePart = minute.isWildcard ? 'every minute' : `minute(s) ${joinValues(minute.values)}`
  const hourPart = hour.isWildcard ? 'every hour' : `hour(s) ${joinValues(hour.values)}`
  return `At ${minutePart}, ${hourPart}`
}

export function describeCron(parsed: ParsedCron): string {
  const parts = [timeClause(parsed.minute, parsed.hour)]

  if (!parsed.month.isWildcard) {
    parts.push(`in ${joinValues(parsed.month.values, MONTH_NAMES)}`)
  }

  if (parsed.domRestricted && parsed.dowRestricted) {
    parts.push(
      `on day-of-month ${joinValues(parsed.dayOfMonth.values)} or on ${joinValues(parsed.dayOfWeek.values, DAY_NAMES)}`,
    )
  } else if (parsed.domRestricted) {
    parts.push(`on day-of-month ${joinValues(parsed.dayOfMonth.values)}`)
  } else if (parsed.dowRestricted) {
    parts.push(`on ${joinValues(parsed.dayOfWeek.values, DAY_NAMES)}`)
  }

  return parts.join(', ') + '.'
}

// --- Next N run times, brute-force with a hard iteration cap -------------

// ~8 years of minutes. Each iteration is a handful of array/number checks,
// so this stays well under a second even in the worst case (an "impossible"
// schedule like day-of-month 31 in February never matches and always burns
// the full cap) — a hard ceiling that keeps a pathological pattern from
// hanging the tab, independent of how many results were requested.
const MAX_ITERATIONS = 8 * 366 * 24 * 60

export interface NextRunsResult {
  runs: Date[]
  truncatedSearch: boolean
}

export function nextRuns(parsed: ParsedCron, count: number, from: Date = new Date()): NextRunsResult {
  const minuteSet = new Set(parsed.minute.values)
  const hourSet = new Set(parsed.hour.values)
  const domSet = new Set(parsed.dayOfMonth.values)
  const monthSet = new Set(parsed.month.values)
  const dowSet = new Set(parsed.dayOfWeek.values)

  const cursor = new Date(from.getTime())
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)

  const runs: Date[] = []
  let iterations = 0

  while (runs.length < count && iterations < MAX_ITERATIONS) {
    iterations++
    const minuteOk = minuteSet.has(cursor.getMinutes())
    const hourOk = hourSet.has(cursor.getHours())
    const monthOk = monthSet.has(cursor.getMonth() + 1)
    const domOk = domSet.has(cursor.getDate())
    const dowOk = dowSet.has(cursor.getDay())

    // Cron's classic gotcha: when BOTH day-of-month and day-of-week are
    // restricted, a date matches if it satisfies EITHER one, not both.
    const dayOk =
      parsed.domRestricted && parsed.dowRestricted
        ? domOk || dowOk
        : parsed.domRestricted
          ? domOk
          : parsed.dowRestricted
            ? dowOk
            : true

    if (minuteOk && hourOk && monthOk && dayOk) {
      runs.push(new Date(cursor.getTime()))
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  return { runs, truncatedSearch: runs.length < count }
}
