export type UrlEncodingScope = 'component' | 'full'

export interface EncodingResult {
  output: string
  error: string | null
}

// encodeURIComponent escapes everything except unreserved characters — the
// right choice for a single value going into a query string or path segment.
// encodeURI only escapes characters that are never valid anywhere in a URL,
// leaving reserved characters like / ? & : alone — the right choice for an
// already-assembled URL. Mixing the two up is a common real bug, so this
// tool keeps them as an explicit, separate choice rather than picking one.
export function urlEncode(text: string, scope: UrlEncodingScope): string {
  return scope === 'component' ? encodeURIComponent(text) : encodeURI(text)
}

export function urlDecode(text: string, scope: UrlEncodingScope): EncodingResult {
  try {
    return { output: scope === 'component' ? decodeURIComponent(text) : decodeURI(text), error: null }
  } catch {
    return { output: '', error: "Couldn't decode — this contains a malformed % escape sequence." }
  }
}
