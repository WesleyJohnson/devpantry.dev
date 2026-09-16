export const COMMON_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
] as const

export interface ParsedDataUri {
  mime: string
  base64: string
}

const DATA_URI_RE = /^data:([^;,]+)(;charset=[^;,]+)?;base64,(.*)$/s

export function parseDataUri(input: string): ParsedDataUri | null {
  const match = DATA_URI_RE.exec(input.trim())
  if (!match) return null
  return { mime: match[1], base64: match[3] }
}

export function buildDataUri(base64: string, mime: string): string {
  return `data:${mime};base64,${base64.trim()}`
}

// A plain base64 payload (no data: prefix) should only contain the base64
// alphabet plus optional padding and whitespace — catches an obviously wrong
// paste (e.g. a data URI missing its "data:...;base64," prefix, or plain
// text) before it ever reaches an <img> tag.
export function looksLikeBase64(input: string): boolean {
  return /^[A-Za-z0-9+/=\s]+$/.test(input.trim()) && input.trim().length > 0
}
