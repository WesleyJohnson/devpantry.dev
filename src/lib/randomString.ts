export const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
}

const AMBIGUOUS = new Set(['0', 'O', '1', 'l', 'I'])

export function buildCharset(
  options: { lowercase: boolean; uppercase: boolean; digits: boolean; symbols: boolean },
  excludeAmbiguous: boolean,
): string {
  let charset = ''
  if (options.lowercase) charset += CHARSETS.lowercase
  if (options.uppercase) charset += CHARSETS.uppercase
  if (options.digits) charset += CHARSETS.digits
  if (options.symbols) charset += CHARSETS.symbols
  if (excludeAmbiguous) charset = [...charset].filter((c) => !AMBIGUOUS.has(c)).join('')
  return charset
}

// Rejection sampling avoids modulo bias: if the charset length does not
// evenly divide 256, naively using byte % charset.length would make the
// low-index characters slightly more likely to appear.
export function generateRandomString(length: number, charset: string): string {
  if (charset.length === 0 || length <= 0) return ''
  const maxValid = Math.floor(256 / charset.length) * charset.length
  const result: string[] = []
  const buffer = new Uint8Array(1)
  while (result.length < length) {
    crypto.getRandomValues(buffer)
    if (buffer[0] < maxValid) {
      result.push(charset[buffer[0] % charset.length])
    }
  }
  return result.join('')
}
