export type AlgFamily = 'hmac' | 'rsa' | 'rsa-pss' | 'ecdsa' | 'none' | 'unsupported'

export interface AlgInfo {
  family: AlgFamily
  hash: string
  ecCurve?: string
}

const ALG_INFO: Record<string, AlgInfo> = {
  HS256: { family: 'hmac', hash: 'SHA-256' },
  HS384: { family: 'hmac', hash: 'SHA-384' },
  HS512: { family: 'hmac', hash: 'SHA-512' },
  RS256: { family: 'rsa', hash: 'SHA-256' },
  RS384: { family: 'rsa', hash: 'SHA-384' },
  RS512: { family: 'rsa', hash: 'SHA-512' },
  PS256: { family: 'rsa-pss', hash: 'SHA-256' },
  PS384: { family: 'rsa-pss', hash: 'SHA-384' },
  PS512: { family: 'rsa-pss', hash: 'SHA-512' },
  ES256: { family: 'ecdsa', hash: 'SHA-256', ecCurve: 'P-256' },
  ES384: { family: 'ecdsa', hash: 'SHA-384', ecCurve: 'P-384' },
  ES512: { family: 'ecdsa', hash: 'SHA-512', ecCurve: 'P-521' },
  none: { family: 'none', hash: '' },
}

const PSS_SALT_LENGTH: Record<string, number> = { 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64 }

export function classifyAlg(alg: string): AlgInfo {
  return ALG_INFO[alg] ?? { family: 'unsupported', hash: '' }
}

function base64UrlToBytes(segment: string): Uint8Array<ArrayBuffer> {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export type VerifyStatus = 'valid' | 'invalid' | 'unsupported' | 'error'

export interface VerifyResult {
  status: VerifyStatus
  message: string
}

// Verifies against the token's literal "header.payload" substrings, not a
// re-serialized JSON.stringify of the decoded header/payload — the
// signature covers the exact bytes that were transmitted, and re-encoding
// could silently differ (key order, spacing) even when the decoded values
// look identical.
export async function verifyJwtSignature(token: string, keyMaterial: string): Promise<VerifyResult> {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return { status: 'error', message: 'Token must have 3 parts to verify.' }
  const [headerPart, payloadPart, signaturePart] = parts

  let header: { alg?: string }
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerPart)))
  } catch {
    return { status: 'error', message: "Couldn't read the header to determine the algorithm." }
  }

  const alg = header.alg ?? ''
  const info = classifyAlg(alg)

  if (info.family === 'none') {
    return {
      status: 'unsupported',
      message: 'This token declares "alg: none" — treated as unverifiable by design, never reported as valid.',
    }
  }
  if (info.family === 'unsupported') {
    return { status: 'unsupported', message: `Algorithm "${alg}" is not supported for verification.` }
  }
  if (!keyMaterial.trim()) {
    return { status: 'error', message: 'Provide a secret (HMAC) or a PEM public key (RSA/EC) to verify against.' }
  }

  let signatureBytes: Uint8Array<ArrayBuffer>
  try {
    signatureBytes = base64UrlToBytes(signaturePart)
  } catch {
    return { status: 'error', message: "Couldn't decode the signature segment." }
  }
  const signingInput = new TextEncoder().encode(`${headerPart}.${payloadPart}`)

  try {
    if (info.family === 'hmac') {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(keyMaterial),
        { name: 'HMAC', hash: info.hash },
        false,
        ['verify'],
      )
      const ok = await crypto.subtle.verify('HMAC', key, signatureBytes, signingInput)
      return ok
        ? { status: 'valid', message: 'Signature verified with the provided secret.' }
        : { status: 'invalid', message: 'Signature does not match — wrong secret, or the token was altered.' }
    }

    const keyData = pemToBuffer(keyMaterial)

    if (info.family === 'rsa') {
      const key = await crypto.subtle.importKey(
        'spki',
        keyData,
        { name: 'RSASSA-PKCS1-v1_5', hash: info.hash },
        false,
        ['verify'],
      )
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signatureBytes, signingInput)
      return ok
        ? { status: 'valid', message: 'Signature verified with the provided public key.' }
        : { status: 'invalid', message: 'Signature does not match — wrong key, or the token was altered.' }
    }

    if (info.family === 'rsa-pss') {
      const key = await crypto.subtle.importKey('spki', keyData, { name: 'RSA-PSS', hash: info.hash }, false, ['verify'])
      const saltLength = PSS_SALT_LENGTH[info.hash] ?? 32
      const ok = await crypto.subtle.verify({ name: 'RSA-PSS', saltLength }, key, signatureBytes, signingInput)
      return ok
        ? { status: 'valid', message: 'Signature verified with the provided public key.' }
        : { status: 'invalid', message: 'Signature does not match — wrong key, or the token was altered.' }
    }

    // ecdsa
    const key = await crypto.subtle.importKey(
      'spki',
      keyData,
      { name: 'ECDSA', namedCurve: info.ecCurve },
      false,
      ['verify'],
    )
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: info.hash }, key, signatureBytes, signingInput)
    return ok
      ? { status: 'valid', message: 'Signature verified with the provided public key.' }
      : { status: 'invalid', message: 'Signature does not match — wrong key, or the token was altered.' }
  } catch (e) {
    return { status: 'error', message: `Couldn't verify: ${(e as Error).message}` }
  }
}
