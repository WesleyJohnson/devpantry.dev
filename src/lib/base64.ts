export function base64Encode(text: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  let encoded = btoa(binary)
  if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return encoded
}

export interface DecodeResult {
  output: string
  error: string | null
}

export function base64Decode(text: string): DecodeResult {
  const trimmed = text.trim()
  if (!trimmed) return { output: '', error: null }
  try {
    let normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/')
    const pad = (4 - (normalized.length % 4)) % 4
    normalized += '='.repeat(pad)
    const binary = atob(normalized)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return { output: new TextDecoder('utf-8', { fatal: true }).decode(bytes), error: null }
  } catch {
    return { output: '', error: "Couldn't decode — is this valid Base64?" }
  }
}
