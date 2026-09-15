const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export function parseInBase(text: string, base: number): bigint | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  const negative = t.startsWith('-')
  let body = negative ? t.slice(1) : t

  if (base === 16 && body.startsWith('0x')) body = body.slice(2)
  else if (base === 2 && body.startsWith('0b')) body = body.slice(2)
  else if (base === 8 && body.startsWith('0o')) body = body.slice(2)

  if (body === '') return null

  const validDigits = DIGITS.slice(0, base)
  let result = 0n
  const bigBase = BigInt(base)
  for (const ch of body) {
    const value = validDigits.indexOf(ch)
    if (value === -1) return null
    result = result * bigBase + BigInt(value)
  }
  return negative ? -result : result
}

// BigInt.prototype.toString natively supports radix 2-36, negatives included.
export function formatInBase(value: bigint, base: number): string {
  return value.toString(base)
}
