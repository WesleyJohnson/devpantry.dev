// Converts between JSON and literal PHP array/value syntax, e.g.
// ['name' => 'Ada', 'tags' => ['math', 'computing']] or the equivalent
// array(...) form. Scoped deliberately to literal values only — no
// variables, no function calls, no string interpolation — the same
// disclosed-limitation approach used for fetch-to-curl's "can't evaluate
// arbitrary expressions" cases.

export type JsonLike = null | boolean | number | string | JsonLike[] | { [k: string]: JsonLike }

export interface PhpJsonResult {
  output: string
  error: string | null
}

class ParseError extends Error {}

class Cursor {
  pos = 0
  text: string
  constructor(text: string) {
    this.text = text
  }
  get done(): boolean {
    return this.pos >= this.text.length
  }
  peek(): string {
    return this.text[this.pos]
  }
  skipTrivia() {
    while (!this.done) {
      const ch = this.peek()
      if (/\s/.test(ch)) {
        this.pos++
        continue
      }
      if (this.text.startsWith('//', this.pos) || this.text.startsWith('#', this.pos)) {
        const nl = this.text.indexOf('\n', this.pos)
        this.pos = nl === -1 ? this.text.length : nl
        continue
      }
      if (this.text.startsWith('/*', this.pos)) {
        const end = this.text.indexOf('*/', this.pos + 2)
        this.pos = end === -1 ? this.text.length : end + 2
        continue
      }
      break
    }
  }
}

function parseSingleQuoted(cursor: Cursor): string {
  cursor.pos++ // opening '
  let out = ''
  while (!cursor.done && cursor.peek() !== "'") {
    if (cursor.peek() === '\\' && (cursor.text[cursor.pos + 1] === "'" || cursor.text[cursor.pos + 1] === '\\')) {
      out += cursor.text[cursor.pos + 1]
      cursor.pos += 2
      continue
    }
    out += cursor.peek()
    cursor.pos++
  }
  if (cursor.done) throw new ParseError("Unterminated single-quoted string — missing closing '.")
  cursor.pos++ // closing '
  return out
}

const DOUBLE_QUOTE_ESCAPES: Record<string, string> = {
  n: '\n',
  t: '\t',
  r: '\r',
  v: '\v',
  f: '\f',
  e: '\x1b',
  '\\': '\\',
  '$': '$',
  '"': '"',
}

function parseDoubleQuoted(cursor: Cursor): string {
  cursor.pos++ // opening "
  let out = ''
  while (!cursor.done && cursor.peek() !== '"') {
    const ch = cursor.peek()
    if (ch === '$' && /[A-Za-z_{]/.test(cursor.text[cursor.pos + 1] ?? '')) {
      throw new ParseError('Double-quoted string contains $variable interpolation, which cannot be evaluated statically — rewrite it as a plain literal.')
    }
    if (ch === '\\') {
      const next = cursor.text[cursor.pos + 1]
      if (next !== undefined && next in DOUBLE_QUOTE_ESCAPES) {
        out += DOUBLE_QUOTE_ESCAPES[next]
        cursor.pos += 2
        continue
      }
      out += ch
      cursor.pos++
      continue
    }
    out += ch
    cursor.pos++
  }
  if (cursor.done) throw new ParseError('Unterminated double-quoted string — missing closing ".')
  cursor.pos++ // closing "
  return out
}

function parseNumber(cursor: Cursor): number {
  const match = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(cursor.text.slice(cursor.pos))
  if (!match) throw new ParseError(`Expected a number near "...${cursor.text.slice(cursor.pos, cursor.pos + 20)}".`)
  cursor.pos += match[0].length
  return Number(match[0])
}

function matchKeyword(cursor: Cursor, word: string): boolean {
  const slice = cursor.text.slice(cursor.pos, cursor.pos + word.length)
  const after = cursor.text[cursor.pos + word.length]
  if (slice.toLowerCase() === word && (after === undefined || !/[A-Za-z0-9_]/.test(after))) {
    cursor.pos += word.length
    return true
  }
  return false
}

interface ArrayEntry {
  key: string | number | null // null = no explicit key (auto-index)
  value: JsonLike
}

function parseArrayBody(cursor: Cursor, close: string): ArrayEntry[] {
  const entries: ArrayEntry[] = []
  while (true) {
    cursor.skipTrivia()
    if (cursor.done) throw new ParseError(`Unterminated array — missing closing "${close}".`)
    if (cursor.peek() === close) {
      cursor.pos++
      return entries
    }
    const first = parseValue(cursor)
    cursor.skipTrivia()
    if (cursor.text.startsWith('=>', cursor.pos)) {
      cursor.pos += 2
      cursor.skipTrivia()
      const value = parseValue(cursor)
      if (typeof first !== 'string' && typeof first !== 'number') {
        throw new ParseError('Array keys must be a string or an integer literal.')
      }
      entries.push({ key: first, value })
    } else {
      entries.push({ key: null, value: first })
    }
    cursor.skipTrivia()
    if (cursor.done) throw new ParseError(`Unterminated array — missing closing "${close}".`)
    if (cursor.peek() === ',') {
      cursor.pos++
      continue
    }
    if (cursor.peek() === close) {
      cursor.pos++
      return entries
    }
    throw new ParseError(`Expected "," or "${close}" near "...${cursor.text.slice(cursor.pos, cursor.pos + 20)}".`)
  }
}

function entriesToJson(entries: ArrayEntry[]): JsonLike {
  let nextAutoIndex = 0
  const resolved: [number | string, JsonLike][] = entries.map((e) => {
    if (e.key === null) {
      const k = nextAutoIndex
      nextAutoIndex++
      return [k, e.value]
    }
    if (typeof e.key === 'number' && Number.isInteger(e.key)) {
      if (e.key + 1 > nextAutoIndex) nextAutoIndex = e.key + 1
      return [e.key, e.value]
    }
    return [e.key, e.value]
  })

  const isList = resolved.every(([k], i) => k === i)
  if (isList) return resolved.map(([, v]) => v)

  const obj: Record<string, JsonLike> = {}
  for (const [k, v] of resolved) obj[String(k)] = v
  return obj
}

function parseValue(cursor: Cursor): JsonLike {
  cursor.skipTrivia()
  if (cursor.done) throw new ParseError('Unexpected end of input.')
  const ch = cursor.peek()

  if (ch === "'") return parseSingleQuoted(cursor)
  if (ch === '"') return parseDoubleQuoted(cursor)
  if (ch === '[') {
    cursor.pos++
    return entriesToJson(parseArrayBody(cursor, ']'))
  }
  if (matchKeyword(cursor, 'array')) {
    cursor.skipTrivia()
    if (cursor.peek() !== '(') throw new ParseError('Expected "(" after "array".')
    cursor.pos++
    return entriesToJson(parseArrayBody(cursor, ')'))
  }
  if (matchKeyword(cursor, 'null')) return null
  if (matchKeyword(cursor, 'true')) return true
  if (matchKeyword(cursor, 'false')) return false
  if (/[-\d]/.test(ch)) return parseNumber(cursor)

  throw new ParseError(`Unexpected token near "...${cursor.text.slice(cursor.pos, cursor.pos + 20)}" — only literal values are supported (no variables or function calls).`)
}

export function phpToJson(input: string): PhpJsonResult {
  if (!input.trim()) return { output: '', error: null }
  try {
    const cursor = new Cursor(input.trim().replace(/;\s*$/, ''))
    const value = parseValue(cursor)
    cursor.skipTrivia()
    if (!cursor.done) throw new ParseError(`Unexpected trailing content near "...${cursor.text.slice(cursor.pos, cursor.pos + 20)}".`)
    return { output: JSON.stringify(value, null, 2), error: null }
  } catch (e) {
    if (e instanceof ParseError) return { output: '', error: e.message }
    throw e
  }
}

function phpStringLiteral(str: string): string {
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

// A key that is exactly a canonical (no leading zero, no "+" sign) integer
// string is treated as a bare PHP int key rather than a quoted string key —
// PHP itself does this coercion automatically for array keys.
function phpKeyLiteral(key: string): string {
  if (/^-?\d+$/.test(key) && String(Number(key)) === key) return key
  return phpStringLiteral(key)
}

function jsonToPhpValue(value: JsonLike, depth: number): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return phpStringLiteral(value)

  const pad = '    '.repeat(depth + 1)
  const closePad = '    '.repeat(depth)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((v) => `${pad}${jsonToPhpValue(v, depth + 1)}`)
    return `[\n${items.join(',\n')},\n${closePad}]`
  }

  const entries = Object.entries(value)
  if (entries.length === 0) return '[]'
  const items = entries.map(([k, v]) => `${pad}${phpKeyLiteral(k)} => ${jsonToPhpValue(v, depth + 1)}`)
  return `[\n${items.join(',\n')},\n${closePad}]`
}

export function jsonToPhp(input: string): PhpJsonResult {
  if (!input.trim()) return { output: '', error: null }
  let parsed: JsonLike
  try {
    parsed = JSON.parse(input)
  } catch (e) {
    return { output: '', error: `Invalid JSON: ${(e as Error).message}` }
  }
  return { output: jsonToPhpValue(parsed, 0), error: null }
}
