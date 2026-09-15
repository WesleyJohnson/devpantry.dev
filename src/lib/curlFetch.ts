export interface ConversionResult {
  output: string
  error: string | null
  warnings: string[]
}

// ---------------------------------------------------------------------------
// Shared low-level scanners (quote- and bracket-aware, so we never split a
// comma or colon that's actually inside a string or nested literal).
// ---------------------------------------------------------------------------

function skipString(str: string, start: number): number {
  const quote = str[start]
  let i = start + 1
  while (i < str.length) {
    if (str[i] === '\\') {
      i += 2
      continue
    }
    if (str[i] === quote) return i
    i++
  }
  return str.length - 1
}

function extractBalanced(str: string, openIndex: number, open: string, close: string): number {
  let depth = 0
  for (let i = openIndex; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(str, i)
      continue
    }
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function splitTopLevel(str: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(str, i)
      current += str.slice(i, end + 1)
      i = end
      continue
    }
    if ('{[('.includes(ch)) depth++
    if ('}])'.includes(ch)) depth--
    if (ch === separator && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim() !== '') parts.push(current)
  return parts
}

function findTopLevelChar(str: string, char: string): number {
  let depth = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(str, i)
      continue
    }
    if ('{[('.includes(ch)) depth++
    if ('}])'.includes(ch)) depth--
    if (ch === char && depth === 0) return i
  }
  return -1
}

// ---------------------------------------------------------------------------
// curl -> fetch
// ---------------------------------------------------------------------------

interface ParsedCurl {
  url: string
  method: string
  headers: [string, string][]
  body: string | null
  formFields: { name: string; value: string; isFile: boolean }[] | null
  warnings: string[]
}

const BOOLEAN_FLAGS = new Set([
  '--compressed',
  '-s',
  '--silent',
  '-v',
  '--verbose',
  '-k',
  '--insecure',
  '-L',
  '--location',
  '-i',
  '--include',
  '-f',
  '--fail',
  '--http1.1',
  '--http2',
  '-4',
  '--ipv4',
  '-6',
  '--ipv6',
  '-#',
  '--progress-bar',
  '-N',
  '--no-buffer',
  '-G',
  '--get',
])

// Flags we recognize but have no fetch() equivalent for — skip flag + value quietly.
const IGNORED_VALUE_FLAGS = new Set([
  '--connect-timeout',
  '--max-time',
  '-m',
  '--retry',
  '--retry-delay',
  '--cacert',
  '--cert',
  '--key',
  '--resolve',
  '--interface',
  '--limit-rate',
  '--range',
  '-r',
  '--proxy',
  '-x',
  '--unix-socket',
  '--cookie-jar',
  '-c',
  '--max-redirs',
])

function tokenizeShell(raw: string): string[] {
  const joined = raw.replace(/\\\r?\n[ \t]*/g, ' ')
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  let started = false

  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i]
    if (quote === "'") {
      if (ch === "'") quote = null
      else current += ch
      continue
    }
    if (quote === '"') {
      if (ch === '"') quote = null
      else if (ch === '\\' && i + 1 < joined.length && '"\\$`\n'.includes(joined[i + 1])) {
        current += joined[++i]
      } else current += ch
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      started = true
      continue
    }
    if (/\s/.test(ch)) {
      if (started || current) tokens.push(current)
      current = ''
      started = false
      continue
    }
    if (ch === '\\' && i + 1 < joined.length) {
      current += joined[++i]
      started = true
      continue
    }
    current += ch
    started = true
  }
  if (started || current) tokens.push(current)
  return tokens
}

function parseCurl(raw: string): ParsedCurl | { error: string } {
  const tokens = tokenizeShell(raw.trim())
  if (tokens.length === 0) return { error: 'Nothing to parse.' }

  let i = 0
  if (tokens[0].toLowerCase() === 'curl') i = 1
  else return { error: 'Doesn\'t look like a curl command — it should start with "curl".' }

  let url: string | null = null
  let method: string | null = null
  const headers: [string, string][] = []
  const dataParts: string[] = []
  const formFields: { name: string; value: string; isFile: boolean }[] = []
  let user: string | null = null
  let useGet = false
  const warnings: string[] = []

  while (i < tokens.length) {
    const tok = tokens[i]

    if (tok === '-X' || tok === '--request') {
      method = tokens[++i] ?? null
      i++
      continue
    }
    if (tok === '-H' || tok === '--header') {
      const line = tokens[++i] ?? ''
      const idx = line.indexOf(':')
      if (idx > -1) headers.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()])
      else warnings.push(`Couldn't parse header: "${line}"`)
      i++
      continue
    }
    if (['-d', '--data', '--data-raw', '--data-ascii', '--data-binary'].includes(tok)) {
      const value = tokens[++i] ?? ''
      if (value.startsWith('@')) {
        warnings.push(
          `This command reads its body from a file (${value}) — a browser can't read your filesystem, so the literal text was kept as a placeholder.`,
        )
      }
      dataParts.push(value)
      i++
      continue
    }
    if (tok === '--data-urlencode') {
      const raw2 = tokens[++i] ?? ''
      const eq = raw2.indexOf('=')
      if (eq > -1) dataParts.push(`${raw2.slice(0, eq)}=${encodeURIComponent(raw2.slice(eq + 1))}`)
      else dataParts.push(encodeURIComponent(raw2))
      i++
      continue
    }
    if (tok === '-F' || tok === '--form') {
      const field = tokens[++i] ?? ''
      const eq = field.indexOf('=')
      const name = eq > -1 ? field.slice(0, eq) : field
      const rawValue = eq > -1 ? field.slice(eq + 1) : ''
      const isFile = rawValue.startsWith('@')
      formFields.push({ name, value: isFile ? rawValue.slice(1) : rawValue, isFile })
      if (isFile) {
        warnings.push(
          `Form field "${name}" uploads a file (@${rawValue.slice(1)}) — wire it up to a real <input type="file"> or Blob in your code before running this.`,
        )
      }
      i++
      continue
    }
    if (tok === '-u' || tok === '--user') {
      user = tokens[++i] ?? ''
      i++
      continue
    }
    if (tok === '-A' || tok === '--user-agent') {
      headers.push(['User-Agent', tokens[++i] ?? ''])
      i++
      continue
    }
    if (tok === '-b' || tok === '--cookie') {
      headers.push(['Cookie', tokens[++i] ?? ''])
      i++
      continue
    }
    if (tok === '-e' || tok === '--referer') {
      headers.push(['Referer', tokens[++i] ?? ''])
      i++
      continue
    }
    if (tok === '-o' || tok === '--output') {
      warnings.push("The -o/--output flag was ignored — fetch() hands the response to your code instead of writing a file.")
      i += 2
      continue
    }
    if (BOOLEAN_FLAGS.has(tok)) {
      if (tok === '-G' || tok === '--get') useGet = true
      i++
      continue
    }
    if (IGNORED_VALUE_FLAGS.has(tok)) {
      i += 2
      continue
    }
    if (tok.startsWith('-')) {
      warnings.push(`Unsupported flag "${tok}" was ignored.`)
      i++
      continue
    }

    if (!url) url = tok
    else warnings.push(`Ignored extra argument: "${tok}"`)
    i++
  }

  if (!url) return { error: 'No URL found in the command.' }

  if (user) {
    const encoded = typeof btoa === 'function' ? btoa(user) : ''
    headers.push(['Authorization', `Basic ${encoded}`])
  }

  let body: string | null = null
  if (formFields.length === 0 && dataParts.length > 0) {
    body = dataParts.join('&')
    const hasContentType = headers.some(([key]) => key.toLowerCase() === 'content-type')
    if (!hasContentType) headers.push(['Content-Type', 'application/x-www-form-urlencoded'])
  }

  if (useGet && body) {
    url += (url.includes('?') ? '&' : '?') + body
    body = null
  }

  if (!method) method = formFields.length > 0 || body ? 'POST' : 'GET'

  return {
    url,
    method: method.toUpperCase(),
    headers,
    body,
    formFields: formFields.length > 0 ? formFields : null,
    warnings,
  }
}

function generateFetchCode(parsed: ParsedCurl): string {
  const setupLines: string[] = []
  const optionEntries: string[] = [`method: ${JSON.stringify(parsed.method)}`]

  if (parsed.headers.length > 0) {
    const headerBody = parsed.headers
      .map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
      .join('\n')
    optionEntries.push(`headers: {\n${headerBody}\n  }`)
  }

  if (parsed.formFields) {
    setupLines.push('const formData = new FormData();')
    for (const field of parsed.formFields) {
      setupLines.push(`formData.append(${JSON.stringify(field.name)}, ${JSON.stringify(field.value)});`)
    }
    optionEntries.push('body: formData')
  } else if (parsed.body !== null) {
    optionEntries.push(`body: ${JSON.stringify(parsed.body)}`)
  }

  const optionsBlock = optionEntries.map((entry) => `  ${entry},`).join('\n')
  const setup = setupLines.length > 0 ? `${setupLines.join('\n')}\n\n` : ''

  return (
    `${setup}fetch(${JSON.stringify(parsed.url)}, {\n${optionsBlock}\n})\n` +
    '  .then((res) => res.json())\n' +
    '  .then((data) => console.log(data))\n' +
    '  .catch((err) => console.error(err));'
  )
}

export function curlToFetch(input: string): ConversionResult {
  if (!input.trim()) return { output: '', error: null, warnings: [] }
  const parsed = parseCurl(input)
  if ('error' in parsed) return { output: '', error: parsed.error, warnings: [] }
  return { output: generateFetchCode(parsed), error: null, warnings: parsed.warnings }
}

// ---------------------------------------------------------------------------
// fetch -> curl
// ---------------------------------------------------------------------------

interface ParsedFetch {
  url: string
  method: string
  headers: [string, string][]
  body: string | null
  warnings: string[]
}

function parseStringLiteral(text: string): { value: string; warning?: string } | null {
  const t = text.trim()
  if (t.length < 2) return null
  const quote = t[0]
  if ((quote === '"' || quote === "'" || quote === '`') && t[t.length - 1] === quote) {
    const inner = t.slice(1, -1)
    if (quote === '`' && /\$\{/.test(inner)) {
      return {
        value: inner,
        warning:
          'A template literal used ${...} interpolation — the raw text was kept as-is; substitute the real value before running.',
      }
    }
    const unescaped = inner.replace(/\\(.)/g, (_match, c: string) => {
      switch (c) {
        case 'n':
          return '\n'
        case 't':
          return '\t'
        case 'r':
          return '\r'
        default:
          return c
      }
    })
    return { value: unescaped }
  }
  return null
}

function jsObjectLiteralToJson(expr: string): string | null {
  try {
    const normalized = expr
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, s: string) => JSON.stringify(s.replace(/\\'/g, "'")))
      .replace(/,\s*([}\]])/g, '$1')
    const parsed: unknown = JSON.parse(normalized)
    return JSON.stringify(parsed)
  } catch {
    return null
  }
}

function parseObjectEntries(text: string): { entries: [string, string][]; error?: string } {
  const t = text.trim()
  if (!t.startsWith('{') || !t.endsWith('}')) return { entries: [], error: 'expected an object literal' }
  const inner = t.slice(1, -1)
  const entries: [string, string][] = []
  for (const raw of splitTopLevel(inner, ',')) {
    if (!raw.trim()) continue
    const colonIdx = findTopLevelChar(raw, ':')
    if (colonIdx === -1) continue
    let key = raw.slice(0, colonIdx).trim()
    const value = raw.slice(colonIdx + 1).trim()
    const keyLiteral = parseStringLiteral(key)
    if (keyLiteral) key = keyLiteral.value
    entries.push([key, value])
  }
  return { entries }
}

function resolveHeadersValue(text: string): { headers: [string, string][]; warnings: string[] } {
  const warnings: string[] = []
  let t = text.trim()
  const headersCtor = /^new\s+Headers\s*\(/.exec(t)
  if (headersCtor) {
    const openParen = t.indexOf('(', headersCtor.index)
    const close = extractBalanced(t, openParen, '(', ')')
    t = close > -1 ? t.slice(openParen + 1, close).trim() : ''
  }
  const { entries, error } = parseObjectEntries(t)
  if (error) {
    warnings.push(`Couldn't read the "headers" option (${error}); it was skipped.`)
    return { headers: [], warnings }
  }
  const headers: [string, string][] = []
  for (const [key, rawValue] of entries) {
    const literal = parseStringLiteral(rawValue)
    if (literal) {
      headers.push([key, literal.value])
      if (literal.warning) warnings.push(literal.warning)
    } else {
      warnings.push(`Header "${key}" isn't a plain string literal — skipped ("${rawValue.trim()}").`)
    }
  }
  return { headers, warnings }
}

function resolveBodyValue(text: string): { body: string | null; warnings: string[] } {
  const warnings: string[] = []
  const t = text.trim()

  const literal = parseStringLiteral(t)
  if (literal) {
    if (literal.warning) warnings.push(literal.warning)
    return { body: literal.value, warnings }
  }

  const stringifyMatch = /^JSON\.stringify\s*\(/.exec(t)
  if (stringifyMatch) {
    const openParen = t.indexOf('(')
    const close = extractBalanced(t, openParen, '(', ')')
    const argText = close > -1 ? t.slice(openParen + 1, close) : ''
    const firstArg = (splitTopLevel(argText, ',')[0] ?? '').trim()
    const asJson = jsObjectLiteralToJson(firstArg)
    if (asJson !== null) return { body: asJson, warnings }
    warnings.push(
      "Couldn't statically evaluate the JSON.stringify(...) argument — used its raw source as the body; double-check it before using.",
    )
    return { body: firstArg, warnings }
  }

  warnings.push(`The "body" option isn't a string or JSON.stringify(...) call — used its raw source as-is ("${t}").`)
  return { body: t, warnings }
}

function parseFetchCall(src: string): ParsedFetch | { error: string } {
  const match = /\bfetch\s*\(/.exec(src)
  if (!match) return { error: "Couldn't find a fetch(...) call in the input." }

  const openParen = match.index + match[0].length - 1
  const closeParen = extractBalanced(src, openParen, '(', ')')
  if (closeParen === -1) return { error: 'Unbalanced parentheses in the fetch(...) call.' }

  const args = splitTopLevel(src.slice(openParen + 1, closeParen), ',')
  if (args.length === 0 || !args[0].trim()) return { error: 'The fetch(...) call is missing a URL.' }

  const urlLiteral = parseStringLiteral(args[0])
  if (!urlLiteral) {
    return { error: "The first argument to fetch() isn't a plain string literal, so it can't be converted." }
  }

  const warnings: string[] = []
  if (urlLiteral.warning) warnings.push(urlLiteral.warning)

  let method = 'GET'
  let headers: [string, string][] = []
  let body: string | null = null

  if (args[1] && args[1].trim()) {
    const { entries, error } = parseObjectEntries(args[1])
    if (error) {
      warnings.push(`Couldn't read the options object (${error}) — only the URL was converted.`)
    } else {
      for (const [key, valueText] of entries) {
        if (key === 'method') {
          const literal = parseStringLiteral(valueText)
          if (literal) method = literal.value.toUpperCase()
          else warnings.push('"method" isn\'t a plain string literal — assumed GET.')
        } else if (key === 'headers') {
          const result = resolveHeadersValue(valueText)
          headers = result.headers
          warnings.push(...result.warnings)
        } else if (key === 'body') {
          const result = resolveBodyValue(valueText)
          body = result.body
          warnings.push(...result.warnings)
          if (method === 'GET') method = 'POST'
        } else {
          warnings.push(`Ignored unsupported fetch option "${key}".`)
        }
      }
    }
  }

  return { url: urlLiteral.value, method, headers, body, warnings }
}

function shQuote(value: string): string {
  if (value === '') return "''"
  if (!value.includes("'")) return `'${value}'`
  const escaped = value.replace(/([$`"\\])/g, '\\$1')
  return `"${escaped}"`
}

function generateCurlCode(parsed: ParsedFetch): string {
  const lines = [`curl ${shQuote(parsed.url)}`]
  if (parsed.method !== 'GET') lines.push(`-X ${parsed.method}`)
  for (const [key, value] of parsed.headers) {
    lines.push(`-H ${shQuote(`${key}: ${value}`)}`)
  }
  if (parsed.body !== null) lines.push(`-d ${shQuote(parsed.body)}`)
  return lines.map((line, i) => (i === 0 ? line : `  ${line}`)).join(' \\\n')
}

export function fetchToCurl(input: string): ConversionResult {
  if (!input.trim()) return { output: '', error: null, warnings: [] }
  const parsed = parseFetchCall(input)
  if ('error' in parsed) return { output: '', error: parsed.error, warnings: [] }
  return { output: generateCurlCode(parsed), error: null, warnings: parsed.warnings }
}
