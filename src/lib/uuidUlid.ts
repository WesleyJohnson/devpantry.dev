// ULID: https://github.com/ulid/spec - 48-bit timestamp (ms since epoch) +
// 80 bits of randomness, encoded as 26 characters of Crockford base32
// (excludes I, L, O, U to avoid visual ambiguity).
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ULID_PATTERN = /^[0-9A-HJKMNPQRSTVWXYZ]{26}$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function encodeTime(time: number, length: number): string {
  let str = ''
  let t = time
  for (let i = length - 1; i >= 0; i--) {
    const mod = t % 32
    str = CROCKFORD[mod] + str
    t = (t - mod) / 32
  }
  return str
}

function encodeRandom(length: number): string {
  // 256 is an exact multiple of 32, so byte % 32 is unbiased.
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let str = ''
  for (let i = 0; i < length; i++) str += CROCKFORD[bytes[i] % 32]
  return str
}

export function generateUlid(): string {
  return encodeTime(Date.now(), 10) + encodeRandom(16)
}

export function generateUuidV4(): string {
  return crypto.randomUUID()
}

export function isUlid(text: string): boolean {
  return ULID_PATTERN.test(text.trim().toUpperCase())
}

export function isUuid(text: string): boolean {
  return UUID_PATTERN.test(text.trim())
}

export function decodeUlidTimestamp(text: string): number | null {
  const trimmed = text.trim().toUpperCase()
  if (!ULID_PATTERN.test(trimmed)) return null
  let time = 0
  for (const ch of trimmed.slice(0, 10)) {
    time = time * 32 + CROCKFORD.indexOf(ch)
  }
  return time
}

export interface UuidInfo {
  version: number
  variant: string
}

// Variant lives in the top bits of the nibble at string index 19 (the first
// hex digit of the 4th group): 0xx = NCS, 10x = RFC 4122, 110 = Microsoft,
// 111 = reserved. Each case tests a different number of leading bits, so
// this has to be an if/else chain rather than a uniform-mask lookup table.
function decodeVariant(nibble: number): string {
  if ((nibble & 0b1000) === 0) return 'NCS (reserved)'
  if ((nibble & 0b1100) === 0b1000) return 'RFC 4122'
  if ((nibble & 0b1110) === 0b1100) return 'Microsoft (reserved)'
  return 'Future (reserved)'
}

export function decodeUuid(text: string): UuidInfo | null {
  const trimmed = text.trim().toLowerCase()
  if (!UUID_PATTERN.test(trimmed)) return null
  const version = parseInt(trimmed[14], 16)
  const variantNibble = parseInt(trimmed[19], 16)
  return { version, variant: decodeVariant(variantNibble) }
}
