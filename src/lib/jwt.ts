export interface DecodedJwt {
  header: unknown
  payload: unknown
  headerRaw: string
  payloadRaw: string
}

export interface JwtDecodeResult {
  decoded: DecodedJwt | null
  error: string | null
}

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

export function decodeJwt(token: string): JwtDecodeResult {
  const trimmed = token.trim()
  if (!trimmed) return { decoded: null, error: null }

  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    return {
      decoded: null,
      error: `Expected 3 dot-separated parts (header.payload.signature), found ${parts.length}.`,
    }
  }
  const [headerPart, payloadPart] = parts

  let headerRawText: string
  let payloadRawText: string
  try {
    headerRawText = base64UrlDecode(headerPart)
  } catch {
    return { decoded: null, error: "Couldn't base64url-decode the header segment." }
  }
  try {
    payloadRawText = base64UrlDecode(payloadPart)
  } catch {
    return { decoded: null, error: "Couldn't base64url-decode the payload segment." }
  }

  let header: unknown
  let payload: unknown
  try {
    header = JSON.parse(headerRawText)
  } catch {
    return { decoded: null, error: 'Header segment is not valid JSON.' }
  }
  try {
    payload = JSON.parse(payloadRawText)
  } catch {
    return { decoded: null, error: 'Payload segment is not valid JSON.' }
  }

  return {
    decoded: {
      header,
      payload,
      headerRaw: JSON.stringify(header, null, 2),
      payloadRaw: JSON.stringify(payload, null, 2),
    },
    error: null,
  }
}

export type ClaimTimeStatus =
  | { kind: 'none' }
  | { kind: 'not-yet-valid'; at: Date; relative: string }
  | { kind: 'expired'; at: Date; relative: string }
  | { kind: 'active'; at: Date; relative: string }

function formatDuration(diffMs: number): string {
  const seconds = Math.max(0, Math.round(diffMs / 1000))
  const units: [string, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [name, secondsPerUnit] of units) {
    if (seconds >= secondsPerUnit) {
      const value = Math.floor(seconds / secondsPerUnit)
      return `${value} ${name}${value === 1 ? '' : 's'}`
    }
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`
}

export function getClaimTimeStatus(payload: unknown): ClaimTimeStatus {
  if (typeof payload !== 'object' || payload === null) return { kind: 'none' }
  const obj = payload as Record<string, unknown>
  const now = Date.now()

  const nbf = typeof obj.nbf === 'number' ? obj.nbf * 1000 : null
  if (nbf !== null && now < nbf) {
    return { kind: 'not-yet-valid', at: new Date(nbf), relative: formatDuration(nbf - now) }
  }

  const exp = typeof obj.exp === 'number' ? obj.exp * 1000 : null
  if (exp !== null) {
    if (now > exp) return { kind: 'expired', at: new Date(exp), relative: formatDuration(now - exp) }
    return { kind: 'active', at: new Date(exp), relative: formatDuration(exp - now) }
  }

  return { kind: 'none' }
}
