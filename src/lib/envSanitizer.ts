export type RedactionReason = 'name' | 'connection-string' | 'value'

export interface RedactedEntry {
  key: string
  reason: RedactionReason
}

export interface SanitizeResult {
  output: string
  redacted: RedactedEntry[]
  warnings: string[]
}

// Key names that conventionally hold sensitive values. Errs toward over-matching
// (e.g. bare "KEY") since for a sanitizer, hiding a non-secret is far cheaper than
// leaking a real one.
const SECRET_KEY_PATTERN =
  /(SECRET|TOKEN|PASSWORD|PASSWD|PWD|PRIVATE|CREDENTIAL|API[_-]?KEY|ACCESS[_-]?KEY|CLIENT[_-]?SECRET|AUTH|DSN|CONN(?:ECTION)?[_-]?STRING|CERT|SIGNING|ENCRYPTION|KEY)/i

const LINE_PATTERN = /^(\s*)(export\s+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*(.*)$/

function looksHighEntropy(value: string): boolean {
  if (value.length < 20) return false
  return /^[A-Za-z0-9+/=_.-]+$/.test(value) && /[0-9]/.test(value) && /[A-Za-z]/.test(value)
}

// scheme://user:pass@host — a connection string with embedded credentials.
function hasEmbeddedCredentials(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/.test(value)
}

function splitValue(rest: string): { value: string; quote: '"' | "'" | null; trailing: string } {
  const first = rest[0]
  if (first === '"' || first === "'") {
    let i = 1
    while (i < rest.length) {
      if (first === '"' && rest[i] === '\\') {
        i += 2
        continue
      }
      if (rest[i] === first) break
      i++
    }
    return { value: rest.slice(1, i), quote: first, trailing: rest.slice(i + 1) }
  }
  // Unquoted values only treat " #" as a comment (a bare "#" inside a URL, for
  // example, should stay part of the value).
  const commentIdx = rest.search(/\s#/)
  if (commentIdx > -1) {
    return { value: rest.slice(0, commentIdx).trimEnd(), quote: null, trailing: rest.slice(commentIdx) }
  }
  return { value: rest.replace(/\s+$/, ''), quote: null, trailing: '' }
}

export function sanitizeEnv(input: string): SanitizeResult {
  const lines = input.split(/\r\n|\r|\n/)
  const redacted: RedactedEntry[] = []
  const warnings: string[] = []

  const outputLines = lines.map((line, index) => {
    if (line.trim() === '' || line.trim().startsWith('#')) return line

    const match = LINE_PATTERN.exec(line)
    if (!match) {
      warnings.push(`Line ${index + 1} doesn't look like KEY=value — left as-is.`)
      return line
    }

    const [, indent, exportPrefix = '', key, rest] = match
    const { value, quote, trailing } = splitValue(rest)

    let reason: RedactionReason | null = null
    if (SECRET_KEY_PATTERN.test(key)) reason = 'name'
    else if (hasEmbeddedCredentials(value)) reason = 'connection-string'
    else if (looksHighEntropy(value)) reason = 'value'

    if (!reason) return line

    redacted.push({ key, reason })
    const q = quote ?? ''
    return `${indent}${exportPrefix}${key}=${q}<REDACTED>${q}${trailing}`
  })

  return { output: outputLines.join('\n'), redacted, warnings }
}
