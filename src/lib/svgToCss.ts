export type SvgEncoding = 'base64' | 'url'

export interface SvgToCssResult {
  dataUri: string
  backgroundSnippet: string
  maskSnippet: string
  error: string | null
}

// btoa() only accepts a "binary string" (one code unit per byte), so a plain
// btoa(svg) throws or mangles anything outside Latin1 (emoji, curly quotes,
// non-ASCII labels inside the SVG). Route through TextEncoder instead — the
// same UTF-8 bytes the browser would send over the wire — and rebuild a
// binary string from those bytes in chunks (String.fromCharCode chokes on
// huge single calls).
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export function svgToCss(input: string, encoding: SvgEncoding): SvgToCssResult {
  const empty = { dataUri: '', backgroundSnippet: '', maskSnippet: '', error: null }
  const trimmed = input.trim()
  if (!trimmed) return empty
  if (!/<svg[\s>]/i.test(trimmed)) {
    return { dataUri: '', backgroundSnippet: '', maskSnippet: '', error: "Doesn't look like SVG source — expected an <svg> tag." }
  }

  const dataUri =
    encoding === 'base64'
      ? `data:image/svg+xml;base64,${utf8ToBase64(trimmed)}`
      : `data:image/svg+xml,${encodeURIComponent(trimmed)}`

  return {
    dataUri,
    backgroundSnippet: `background-image: url("${dataUri}");`,
    maskSnippet: `mask-image: url("${dataUri}");\n-webkit-mask-image: url("${dataUri}");`,
    error: null,
  }
}
