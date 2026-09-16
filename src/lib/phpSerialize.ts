// PHP's serialize() format, per the documented grammar:
//   N;                        null
//   b:0; / b:1;                bool
//   i:123;                     int
//   d:1.5;                     float
//   s:LEN:"...";                string, LEN is the BYTE length (UTF-8), not char count
//   a:COUNT:{key;val;...}      array, COUNT is the number of pairs
//   O:LEN:"Class":COUNT:{...}  object, same shape as an array plus a class name
//
// JSON has no notion of a PHP object vs an associative array, so this tool
// documents its own mapping rather than leaving it implicit: a JSON object
// with a "__phpClass" string key round-trips as a PHP object of that class;
// every other JSON object becomes a PHP associative array.

export type JsonLike = null | boolean | number | string | JsonLike[] | { [k: string]: JsonLike }

export interface PhpFormatResult {
  output: string
  error: string | null
}

function utf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length
}

function serializeValue(value: JsonLike): string {
  if (value === null) return 'N;'
  if (typeof value === 'boolean') return `b:${value ? 1 : 0};`
  if (typeof value === 'number') {
    return Number.isInteger(value) ? `i:${value};` : `d:${value};`
  }
  if (typeof value === 'string') return `s:${utf8ByteLength(value)}:"${value}";`
  if (Array.isArray(value)) {
    const body = value.map((item, i) => `${serializeValue(i)}${serializeValue(item)}`).join('')
    return `a:${value.length}:{${body}}`
  }

  const { __phpClass, ...rest } = value as { __phpClass?: string } & Record<string, JsonLike>
  const entries = Object.entries(rest)
  const body = entries.map(([k, v]) => `${serializeValue(k)}${serializeValue(v)}`).join('')
  if (typeof __phpClass === 'string') {
    return `O:${utf8ByteLength(__phpClass)}:"${__phpClass}":${entries.length}:{${body}}`
  }
  return `a:${entries.length}:{${body}}`
}

export function jsonToPhpSerialize(input: string): PhpFormatResult {
  if (!input.trim()) return { output: '', error: null }
  let parsed: JsonLike
  try {
    parsed = JSON.parse(input)
  } catch (e) {
    return { output: '', error: `Invalid JSON: ${(e as Error).message}` }
  }
  try {
    return { output: serializeValue(parsed), error: null }
  } catch (e) {
    return { output: '', error: (e as Error).message }
  }
}

// --- Unserialize ------------------------------------------------------

class ParseError extends Error {}

// PHP's s:LEN:"..." length is a byte count, and a byte position can land
// mid-character for multi-byte UTF-8 — so this walks the UTF-8 bytes
// directly instead of a JS (UTF-16) string index, exactly like the real
// unserialize() would when reading N raw bytes off the wire.
class ByteCursor {
  bytes: Uint8Array
  pos = 0
  private decoder = new TextDecoder('utf-8', { fatal: false })

  constructor(text: string) {
    this.bytes = new TextEncoder().encode(text)
  }

  get done(): boolean {
    return this.pos >= this.bytes.length
  }

  peekChar(): string {
    return String.fromCharCode(this.bytes[this.pos])
  }

  expect(char: string) {
    if (this.done || this.peekChar() !== char) {
      throw new ParseError(`Expected "${char}" at byte ${this.pos}, found "${this.done ? 'end of input' : this.peekChar()}".`)
    }
    this.pos++
  }

  readUntil(char: string): string {
    const start = this.pos
    while (!this.done && this.peekChar() !== char) this.pos++
    if (this.done) throw new ParseError(`Expected "${char}" before end of input.`)
    const slice = this.bytes.subarray(start, this.pos)
    return this.decoder.decode(slice)
  }

  readBytesAsString(byteLen: number): string {
    const slice = this.bytes.subarray(this.pos, this.pos + byteLen)
    if (slice.length !== byteLen) throw new ParseError('Unexpected end of input inside a string value.')
    this.pos += byteLen
    return this.decoder.decode(slice)
  }
}

function unserializeValue(cursor: ByteCursor): JsonLike {
  if (cursor.done) throw new ParseError('Unexpected end of input.')
  const tag = cursor.peekChar()

  if (tag === 'N') {
    cursor.pos++
    cursor.expect(';')
    return null
  }
  if (tag === 'b') {
    cursor.pos++
    cursor.expect(':')
    const v = cursor.readUntil(';')
    cursor.expect(';')
    if (v !== '0' && v !== '1') throw new ParseError(`Invalid boolean value "b:${v};".`)
    return v === '1'
  }
  if (tag === 'i') {
    cursor.pos++
    cursor.expect(':')
    const v = cursor.readUntil(';')
    cursor.expect(';')
    return parseInt(v, 10)
  }
  if (tag === 'd') {
    cursor.pos++
    cursor.expect(':')
    const v = cursor.readUntil(';')
    cursor.expect(';')
    return parseFloat(v)
  }
  if (tag === 's') {
    cursor.pos++
    cursor.expect(':')
    const lenStr = cursor.readUntil(':')
    cursor.expect(':')
    const byteLen = parseInt(lenStr, 10)
    cursor.expect('"')
    const value = cursor.readBytesAsString(byteLen)
    cursor.expect('"')
    cursor.expect(';')
    return value
  }
  if (tag === 'a') {
    cursor.pos++
    cursor.expect(':')
    const countStr = cursor.readUntil(':')
    cursor.expect(':')
    const count = parseInt(countStr, 10)
    cursor.expect('{')
    const entries: [JsonLike, JsonLike][] = []
    for (let i = 0; i < count; i++) {
      const key = unserializeValue(cursor)
      const value = unserializeValue(cursor)
      entries.push([key, value])
    }
    cursor.expect('}')
    return entriesToJsValue(entries)
  }
  if (tag === 'O') {
    cursor.pos++
    cursor.expect(':')
    const classLenStr = cursor.readUntil(':')
    cursor.expect(':')
    const classLen = parseInt(classLenStr, 10)
    cursor.expect('"')
    const className = cursor.readBytesAsString(classLen)
    cursor.expect('"')
    cursor.expect(':')
    const countStr = cursor.readUntil(':')
    cursor.expect(':')
    const count = parseInt(countStr, 10)
    cursor.expect('{')
    const obj: Record<string, JsonLike> = { __phpClass: className }
    for (let i = 0; i < count; i++) {
      const key = unserializeValue(cursor)
      const value = unserializeValue(cursor)
      obj[String(key)] = value
    }
    cursor.expect('}')
    return obj
  }

  throw new ParseError(`Unknown type tag "${tag}" at byte ${cursor.pos}.`)
}

// A PHP array with keys exactly 0..N-1 in order is indistinguishable from a
// list, so it becomes a JSON array — any other key shape (string keys, gaps,
// out-of-order ints) becomes a JSON object, same as json_encode() does.
function entriesToJsValue(entries: [JsonLike, JsonLike][]): JsonLike {
  const isList = entries.every(([k], i) => k === i)
  if (isList) return entries.map(([, v]) => v)
  const obj: Record<string, JsonLike> = {}
  for (const [k, v] of entries) obj[String(k)] = v
  return obj
}

export function phpUnserializeToJson(input: string): PhpFormatResult {
  if (!input.trim()) return { output: '', error: null }
  try {
    const cursor = new ByteCursor(input.trim())
    const value = unserializeValue(cursor)
    if (!cursor.done) {
      throw new ParseError(`Unexpected trailing data at byte ${cursor.pos}.`)
    }
    return { output: JSON.stringify(value, null, 2), error: null }
  } catch (e) {
    if (e instanceof ParseError) return { output: '', error: e.message }
    throw e
  }
}
