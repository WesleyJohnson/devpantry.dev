// JSON string escaping is a strict subset of JS/most C-family languages'
// backslash escaping, and both directions are natively implemented in the
// engine, so reusing them here is both simpler and more reliably correct
// than hand-rolling an escape table.
export function backslashEscape(text: string): string {
  return JSON.stringify(text).slice(1, -1)
}

export interface UnescapeResult {
  output: string
  error: string | null
}

export function backslashUnescape(text: string): UnescapeResult {
  if (!text) return { output: '', error: null }
  try {
    return { output: JSON.parse(`"${text}"`), error: null }
  } catch {
    return {
      output: '',
      error: "Couldn't unescape — check for an unescaped quote or an invalid escape sequence.",
    }
  }
}
