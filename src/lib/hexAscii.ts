export function textToHex(text: string): string {
  const bytes = new TextEncoder().encode(text)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ')
}

export interface HexToTextResult {
  output: string
  error: string | null
}

export function hexToText(hex: string): HexToTextResult {
  const cleaned = hex.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '')
  if (cleaned.length === 0) return { output: '', error: null }
  if (cleaned.length % 2 !== 0) {
    return { output: '', error: 'Hex string has an odd number of digits — bytes are 2 digits each.' }
  }
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
  }
  try {
    return { output: new TextDecoder('utf-8', { fatal: true }).decode(bytes), error: null }
  } catch {
    return { output: '', error: "These bytes aren't valid UTF-8 text." }
  }
}
