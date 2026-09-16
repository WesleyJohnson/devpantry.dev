export interface CsvParseResult {
  rows: string[][]
  error: string | null
}

// Hand-rolled RFC 4180 parser, character by character rather than
// split(",")/split("\n") — those break the moment a field quotes a comma or
// embeds a literal newline, which is exactly the case this format exists to
// handle. State machine covers: quoted fields, "" as an escaped quote inside
// a quoted field, CRLF/LF/CR line endings, and a trailing newline producing
// no phantom empty row.
export function parseCsv(input: string, delimiter: string): CsvParseResult {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const n = input.length
  let sawAnyField = false

  while (i < n) {
    const ch = input[i]

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }

    if (ch === '"') {
      if (field !== '') {
        return { rows: [], error: `Unexpected quote inside an unquoted field near position ${i}.` }
      }
      inQuotes = true
      sawAnyField = true
      i++
      continue
    }
    if (ch === delimiter) {
      row.push(field)
      field = ''
      sawAnyField = true
      i++
      continue
    }
    if (ch === '\r' || ch === '\n') {
      row.push(field)
      rows.push(row)
      field = ''
      row = []
      sawAnyField = false
      if (ch === '\r' && input[i + 1] === '\n') i += 2
      else i++
      continue
    }
    field += ch
    sawAnyField = true
    i++
  }

  if (inQuotes) return { rows: [], error: 'Unterminated quoted field — a closing quote is missing.' }
  if (sawAnyField || field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return { rows, error: null }
}

export interface CsvToJsonResult {
  json: string
  warnings: string[]
  error: string | null
}

export function csvToJson(input: string, delimiter: string, hasHeader: boolean): CsvToJsonResult {
  if (!input.trim()) return { json: '', warnings: [], error: null }
  const { rows, error } = parseCsv(input, delimiter)
  if (error) return { json: '', warnings: [], error }
  if (rows.length === 0) return { json: '[]', warnings: [], error: null }

  const warnings: string[] = []

  if (!hasHeader) {
    return { json: JSON.stringify(rows, null, 2), warnings, error: null }
  }

  const headers = rows[0]
  const dataRows = rows.slice(1)
  let sawRaggedRow = false

  const objects = dataRows.map((r) => {
    if (r.length !== headers.length) sawRaggedRow = true
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? ''
    })
    return obj
  })

  if (sawRaggedRow) {
    warnings.push(
      'Some rows had a different number of columns than the header — missing cells were filled with an empty string and extra cells were dropped.',
    )
  }

  return { json: JSON.stringify(objects, null, 2), warnings, error: null }
}

export interface JsonToCsvResult {
  csv: string
  warnings: string[]
  error: string | null
}

function csvEscape(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes(delimiter) || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function stringifyCell(value: unknown): { text: string; wasFlattened: boolean } {
  if (value === null || value === undefined) return { text: '', wasFlattened: false }
  if (typeof value === 'object') return { text: JSON.stringify(value), wasFlattened: true }
  return { text: String(value), wasFlattened: false }
}

export function jsonToCsv(input: string, delimiter: string): JsonToCsvResult {
  if (!input.trim()) return { csv: '', warnings: [], error: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (e) {
    return { csv: '', warnings: [], error: `Invalid JSON: ${(e as Error).message}` }
  }

  if (!Array.isArray(parsed)) {
    return { csv: '', warnings: [], error: 'Expected a JSON array of objects (or array of arrays).' }
  }
  if (parsed.length === 0) return { csv: '', warnings: [], error: null }

  const warnings: string[] = []

  if (Array.isArray(parsed[0])) {
    const rows = parsed as unknown[][]
    const lines = rows.map((r) => r.map((cell) => csvEscape(stringifyCell(cell).text, delimiter)).join(delimiter))
    return { csv: lines.join('\r\n'), warnings, error: null }
  }

  if (typeof parsed[0] !== 'object' || parsed[0] === null) {
    return { csv: '', warnings: [], error: 'Array elements must be objects or arrays — found a plain value instead.' }
  }

  // Column order: first-seen key order across all rows, not just row 0 — so
  // a row with an extra field later in the array still gets its own column
  // instead of being silently dropped.
  const columns: string[] = []
  const seen = new Set<string>()
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue
    for (const key of Object.keys(item as Record<string, unknown>)) {
      if (!seen.has(key)) {
        seen.add(key)
        columns.push(key)
      }
    }
  }

  let flattenedAny = false
  const lines = [columns.map((c) => csvEscape(c, delimiter)).join(delimiter)]
  for (const item of parsed) {
    const obj = (item ?? {}) as Record<string, unknown>
    const cells = columns.map((col) => {
      const { text, wasFlattened } = stringifyCell(obj[col])
      if (wasFlattened) flattenedAny = true
      return csvEscape(text, delimiter)
    })
    lines.push(cells.join(delimiter))
  }

  if (flattenedAny) {
    warnings.push('Nested objects/arrays were flattened into their cell as a JSON string.')
  }

  return { csv: lines.join('\r\n'), warnings, error: null }
}
