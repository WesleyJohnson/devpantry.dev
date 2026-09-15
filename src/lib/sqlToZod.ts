import { extractBalanced, skipString, splitTopLevel } from '@/lib/textScan'
import { toCamelCase, toPascalCase } from '@/lib/stringCase'

export interface SqlToZodResult {
  output: string
  tableCount: number
  warnings: string[]
  error: string | null
}

// ---------------------------------------------------------------------------
// A tiny cursor over a single column/constraint definition. SQL's grammar
// here is simple enough that a hand-rolled scanner is far less code (and
// easier to reason about) than pulling in a full SQL parser.
// ---------------------------------------------------------------------------

class Cursor {
  private text: string
  pos = 0

  constructor(text: string) {
    this.text = text
  }

  get remaining(): string {
    return this.text.slice(this.pos)
  }

  get done(): boolean {
    return this.pos >= this.text.length
  }

  skipWs() {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) this.pos++
  }

  peekWord(): string | null {
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.remaining)
    return m ? m[0] : null
  }

  tryConsumeKeyword(word: string): boolean {
    this.skipWs()
    const w = this.peekWord()
    if (w && w.toUpperCase() === word.toUpperCase()) {
      this.pos += w.length
      return true
    }
    return false
  }

  readIdentifier(): string | null {
    this.skipWs()
    const m = /^(`([^`]+)`|"([^"]+)"|\[([^\]]+)\]|([A-Za-z_][A-Za-z0-9_$]*))/.exec(this.remaining)
    if (!m) return null
    this.pos += m[0].length
    return m[2] ?? m[3] ?? m[4] ?? m[5] ?? null
  }

  readBalanced(open: string, close: string): string | null {
    this.skipWs()
    if (this.text[this.pos] !== open) return null
    const end = extractBalanced(this.text, this.pos, open, close)
    if (end === -1) return null
    const inner = this.text.slice(this.pos + 1, end)
    this.pos = end + 1
    return inner
  }

  // Consumes a DEFAULT value we don't try to preserve (quoted literal,
  // function call, or a bare token) so parsing can continue past it.
  consumeDefaultValue() {
    this.skipWs()
    const rest = this.remaining
    if (rest[0] === "'" || rest[0] === '"') {
      const end = skipString(this.text, this.pos)
      this.pos = end + 1
      return
    }
    const word = this.peekWord()
    if (word) {
      const afterWordPos = this.pos + word.length
      if (this.text[afterWordPos] === '(') {
        const close = extractBalanced(this.text, afterWordPos, '(', ')')
        if (close > -1) {
          this.pos = close + 1
          return
        }
      }
    }
    const stopWords = /\b(NOT|NULL|PRIMARY|UNIQUE|DEFAULT|CHECK|REFERENCES|COLLATE|GENERATED|AUTO_INCREMENT)\b/i
    const m = stopWords.exec(rest)
    this.pos += m ? m.index : rest.length
  }
}

function readIdentifierChain(text: string): { name: string; consumed: number } | null {
  let idx = 0
  function skipWs() {
    while (idx < text.length && /\s/.test(text[idx])) idx++
  }
  function readIdent(): string | null {
    const m = /^(`([^`]+)`|"([^"]+)"|\[([^\]]+)\]|([A-Za-z_][A-Za-z0-9_$]*))/.exec(text.slice(idx))
    if (!m) return null
    idx += m[0].length
    return m[2] ?? m[3] ?? m[4] ?? m[5] ?? null
  }

  skipWs()
  let name = readIdent()
  if (name === null) return null
  while (true) {
    const save = idx
    skipWs()
    if (text[idx] === '.') {
      idx++
      skipWs()
      const next = readIdent()
      if (next === null) {
        idx = save
        break
      }
      name = next
    } else {
      idx = save
      break
    }
  }
  return { name, consumed: idx }
}

function stripIdentifierQuotes(s: string): string {
  const t = s.trim()
  const m = /^(`([^`]+)`|"([^"]+)"|\[([^\]]+)\]|([A-Za-z_][A-Za-z0-9_$]*))$/.exec(t)
  if (!m) return t
  return m[2] ?? m[3] ?? m[4] ?? m[5] ?? t
}

function stripValueQuotes(s: string): string {
  const t = s.trim()
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1).replace(/''/g, "'")
  }
  return t
}

// ---------------------------------------------------------------------------
// Type mapping
// ---------------------------------------------------------------------------

const MULTI_WORD_TYPES: [RegExp, string][] = [
  [/^DOUBLE\s+PRECISION\b/i, 'DOUBLE PRECISION'],
  [/^CHARACTER\s+VARYING\b/i, 'CHARACTER VARYING'],
  [/^BIT\s+VARYING\b/i, 'BIT VARYING'],
  [/^TIMESTAMP(?:TZ)?\s+WITH(?:OUT)?\s+TIME\s+ZONE\b/i, 'TIMESTAMP'],
  [/^TIME\s+WITH(?:OUT)?\s+TIME\s+ZONE\b/i, 'TIME'],
]

const SIMPLE_TYPE_MAP: Record<string, string> = {
  VARCHAR: 'z.string()',
  'CHARACTER VARYING': 'z.string()',
  CHAR: 'z.string()',
  CHARACTER: 'z.string()',
  TEXT: 'z.string()',
  TINYTEXT: 'z.string()',
  MEDIUMTEXT: 'z.string()',
  LONGTEXT: 'z.string()',
  UUID: 'z.string().uuid()',
  INET: 'z.string()',
  CIDR: 'z.string()',
  MACADDR: 'z.string()',
  XML: 'z.string()',

  INT: 'z.number().int()',
  INTEGER: 'z.number().int()',
  BIGINT: 'z.number().int()',
  SMALLINT: 'z.number().int()',
  TINYINT: 'z.number().int()',
  MEDIUMINT: 'z.number().int()',
  SERIAL: 'z.number().int()',
  BIGSERIAL: 'z.number().int()',
  SMALLSERIAL: 'z.number().int()',
  YEAR: 'z.number().int()',

  DECIMAL: 'z.number()',
  NUMERIC: 'z.number()',
  FLOAT: 'z.number()',
  DOUBLE: 'z.number()',
  'DOUBLE PRECISION': 'z.number()',
  REAL: 'z.number()',
  MONEY: 'z.number()',

  BOOLEAN: 'z.boolean()',
  BOOL: 'z.boolean()',

  DATE: 'z.coerce.date()',
  DATETIME: 'z.coerce.date()',
  TIMESTAMP: 'z.coerce.date()',
  TIMESTAMPTZ: 'z.coerce.date()',
  TIME: 'z.string()',

  JSON: 'z.unknown()',
  JSONB: 'z.unknown()',

  BYTEA: 'z.instanceof(Uint8Array)',
  BLOB: 'z.instanceof(Uint8Array)',
}

function mapType(typeName: string, args: string[] | null): { zod: string; recognized: boolean } {
  const upper = typeName.toUpperCase()

  if (upper === 'ENUM' && args && args.length > 0) {
    const values = args.map((a) => JSON.stringify(stripValueQuotes(a)))
    return { zod: `z.enum([${values.join(', ')}])`, recognized: true }
  }

  const base = SIMPLE_TYPE_MAP[upper]
  if (!base) return { zod: 'z.unknown()', recognized: false }

  const isVarchar = upper === 'VARCHAR' || upper === 'CHARACTER VARYING' || upper === 'CHAR' || upper === 'CHARACTER'
  if (isVarchar && args?.[0]) {
    const n = Number(args[0].trim())
    if (Number.isFinite(n)) return { zod: `z.string().max(${n})`, recognized: true }
  }

  return { zod: base, recognized: true }
}

// ---------------------------------------------------------------------------
// Column & table-constraint parsing
// ---------------------------------------------------------------------------

interface ParsedColumn {
  name: string
  baseZodType: string
  notNull: boolean
  isPrimaryKey: boolean
  isOptional: boolean
  unrecognizedType: string | null
  hasInlineCheck: boolean
}

function parseColumnDef(raw: string): ParsedColumn | null {
  const cursor = new Cursor(raw.trim())
  const name = cursor.readIdentifier()
  if (!name) return null

  cursor.skipWs()
  if (cursor.done) return null

  let typeName: string | null = null
  for (const [re, label] of MULTI_WORD_TYPES) {
    const m = re.exec(cursor.remaining)
    if (m) {
      typeName = label
      cursor.pos += m[0].length
      break
    }
  }
  if (!typeName) {
    const word = cursor.peekWord()
    if (!word) return null
    typeName = word
    cursor.pos += word.length
  }

  let args: string[] | null = null
  const argsText = cursor.readBalanced('(', ')')
  if (argsText !== null) args = splitTopLevel(argsText, ',').map((a) => a.trim())

  let isArray = false
  while (true) {
    cursor.skipWs()
    if (cursor.remaining.startsWith('[]')) {
      isArray = true
      cursor.pos += 2
    } else break
  }

  const { zod: mappedZod, recognized } = mapType(typeName, args)
  const baseZodType = isArray ? `z.array(${mappedZod})` : mappedZod

  let notNull = false
  let isPrimaryKey = false
  let hasDefault = false
  let hasInlineCheck = false
  let isSerial = /^(SMALL|BIG)?SERIAL$/i.test(typeName)

  while (!cursor.done) {
    cursor.skipWs()
    if (cursor.done) break
    if (cursor.tryConsumeKeyword('NOT')) {
      cursor.tryConsumeKeyword('NULL')
      notNull = true
      continue
    }
    if (cursor.tryConsumeKeyword('NULL')) continue
    if (cursor.tryConsumeKeyword('PRIMARY')) {
      cursor.tryConsumeKeyword('KEY')
      isPrimaryKey = true
      continue
    }
    if (cursor.tryConsumeKeyword('UNIQUE')) continue
    if (cursor.tryConsumeKeyword('AUTO_INCREMENT') || cursor.tryConsumeKeyword('AUTOINCREMENT')) {
      isSerial = true
      continue
    }
    if (cursor.tryConsumeKeyword('DEFAULT')) {
      hasDefault = true
      cursor.consumeDefaultValue()
      continue
    }
    if (cursor.tryConsumeKeyword('CHECK')) {
      cursor.readBalanced('(', ')')
      hasInlineCheck = true
      continue
    }
    if (cursor.tryConsumeKeyword('REFERENCES')) {
      cursor.readIdentifier()
      cursor.readBalanced('(', ')')
      continue
    }
    if (cursor.tryConsumeKeyword('COLLATE')) {
      cursor.readIdentifier()
      continue
    }
    if (cursor.tryConsumeKeyword('GENERATED')) {
      hasDefault = true
      break
    }
    break
  }

  return {
    name,
    baseZodType,
    notNull,
    isPrimaryKey,
    isOptional: hasDefault || isSerial,
    unrecognizedType: recognized ? null : typeName,
    hasInlineCheck,
  }
}

const TABLE_CONSTRAINT_KEYWORDS = /^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\b/i

function isTableConstraint(entry: string): boolean {
  return TABLE_CONSTRAINT_KEYWORDS.test(entry.trim())
}

function processTableConstraint(
  entry: string,
  columnsByName: Map<string, ParsedColumn>,
  warnings: string[],
  tableName: string,
) {
  let text = entry.trim()
  const named = /^CONSTRAINT\s+(?:`[^`]+`|"[^"]+"|\[[^\]]+\]|[A-Za-z_][A-Za-z0-9_]*)\s+/i.exec(text)
  if (named) text = text.slice(named[0].length)

  if (/^PRIMARY\s+KEY/i.test(text)) {
    const cursor = new Cursor(text)
    cursor.tryConsumeKeyword('PRIMARY')
    cursor.tryConsumeKeyword('KEY')
    const inner = cursor.readBalanced('(', ')')
    if (inner) {
      for (const rawName of splitTopLevel(inner, ',')) {
        const col = columnsByName.get(stripIdentifierQuotes(rawName))
        if (col) col.isPrimaryKey = true
      }
    }
    return
  }

  if (/^CHECK\b/i.test(text)) {
    warnings.push(
      `Table "${tableName}": a CHECK constraint was ignored — Zod has no direct equivalent; add a .refine() manually if needed.`,
    )
    return
  }

  // UNIQUE / FOREIGN KEY / INDEX / bare KEY are DB-only concerns with no
  // effect on the value's shape, so they're silently dropped.
}

// ---------------------------------------------------------------------------
// Table discovery & assembly
// ---------------------------------------------------------------------------

function findCreateTables(sql: string): { tableNameRaw: string; body: string }[] {
  const results: { tableNameRaw: string; body: string }[] = []
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(sql))) {
    const afterKeyword = sql.slice(match.index + match[0].length)
    const chain = readIdentifierChain(afterKeyword)
    if (!chain) continue
    let pos = match.index + match[0].length + chain.consumed
    while (pos < sql.length && /\s/.test(sql[pos])) pos++
    if (sql[pos] !== '(') continue
    const closeIdx = extractBalanced(sql, pos, '(', ')')
    if (closeIdx === -1) continue
    results.push({ tableNameRaw: chain.name, body: sql.slice(pos + 1, closeIdx) })
    re.lastIndex = closeIdx + 1
  }
  return results
}

function composeField(col: ParsedColumn): string {
  const nullable = !col.notNull && !col.isPrimaryKey
  let t = col.baseZodType
  if (nullable) t += '.nullable()'
  if (col.isOptional) t += '.optional()'
  return t
}

function formatKey(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name)
}

export function sqlToZod(sql: string): SqlToZodResult {
  if (!sql.trim()) return { output: '', tableCount: 0, warnings: [], error: null }

  const found = findCreateTables(sql)
  if (found.length === 0) {
    return { output: '', tableCount: 0, warnings: [], error: 'No CREATE TABLE statement found.' }
  }

  const warnings: string[] = []

  const blocks = found.map(({ tableNameRaw, body }) => {
    const entries = splitTopLevel(body, ',')
    const columns: ParsedColumn[] = []

    const constraintEntries: string[] = []
    for (const entry of entries) {
      if (!entry.trim()) continue
      if (isTableConstraint(entry)) {
        constraintEntries.push(entry)
        continue
      }
      const col = parseColumnDef(entry)
      if (col) columns.push(col)
      else {
        const preview = entry.trim().slice(0, 40)
        warnings.push(`Table "${tableNameRaw}": couldn't parse a column definition near "${preview}" — skipped.`)
      }
    }

    const columnsByName = new Map(columns.map((c) => [c.name, c]))
    for (const entry of constraintEntries) {
      processTableConstraint(entry, columnsByName, warnings, tableNameRaw)
    }

    for (const col of columns) {
      if (col.unrecognizedType) {
        warnings.push(
          `Table "${tableNameRaw}": column "${col.name}" has an unrecognized type "${col.unrecognizedType}" — mapped to z.unknown().`,
        )
      }
      if (col.hasInlineCheck) {
        warnings.push(
          `Table "${tableNameRaw}": a CHECK constraint on "${col.name}" was ignored — Zod has no direct equivalent; add a .refine() manually if needed.`,
        )
      }
    }

    const schemaName = `${toCamelCase(tableNameRaw, 'table')}Schema`
    const typeName = toPascalCase(tableNameRaw, 'Table')
    const fieldLines = columns.map((c) => `  ${formatKey(c.name)}: ${composeField(c)},`).join('\n')

    return `export const ${schemaName} = z.object({\n${fieldLines}\n})\n\nexport type ${typeName} = z.infer<typeof ${schemaName}>`
  })

  const output = `import { z } from 'zod'\n\n${blocks.join('\n\n')}`

  return { output, tableCount: found.length, warnings, error: null }
}
