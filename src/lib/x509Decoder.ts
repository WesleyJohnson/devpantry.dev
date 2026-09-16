import 'reflect-metadata'
import * as x509 from '@peculiar/x509'

// @peculiar/x509 defers all actual cryptography (signature verification,
// fingerprint hashing) to whatever Web Crypto implementation is registered
// here — the browser's own window.crypto, so parsing and fingerprinting are
// backed by the same native crypto every other tool in this app uses, not a
// bundled implementation.
x509.cryptoProvider.set(crypto)

// Extended Key Usage and public-key-algorithm OIDs have no built-in
// human-readable names in this library — this is a small, bounded lookup
// for the common ones, falling back to the raw OID string for anything else
// rather than guessing.
const EKU_NAMES: Record<string, string> = {
  '1.3.6.1.5.5.7.3.1': 'TLS Server Authentication',
  '1.3.6.1.5.5.7.3.2': 'TLS Client Authentication',
  '1.3.6.1.5.5.7.3.3': 'Code Signing',
  '1.3.6.1.5.5.7.3.4': 'Email Protection',
  '1.3.6.1.5.5.7.3.8': 'Time Stamping',
  '1.3.6.1.5.5.7.3.9': 'OCSP Signing',
}

const KEY_USAGE_FLAGS: [number, string][] = [
  [x509.KeyUsageFlags.digitalSignature, 'Digital Signature'],
  [x509.KeyUsageFlags.nonRepudiation, 'Non-Repudiation'],
  [x509.KeyUsageFlags.keyEncipherment, 'Key Encipherment'],
  [x509.KeyUsageFlags.dataEncipherment, 'Data Encipherment'],
  [x509.KeyUsageFlags.keyAgreement, 'Key Agreement'],
  [x509.KeyUsageFlags.keyCertSign, 'Certificate Signing'],
  [x509.KeyUsageFlags.cRLSign, 'CRL Signing'],
  [x509.KeyUsageFlags.encipherOnly, 'Encipher Only'],
  [x509.KeyUsageFlags.decipherOnly, 'Decipher Only'],
]

function hexFingerprint(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':')
}

function describePublicKey(alg: Algorithm): string {
  const a = alg as Algorithm & { modulusLength?: number; namedCurve?: string }
  if (a.name === 'RSASSA-PKCS1-v1_5' || a.name === 'RSA-PSS' || a.name === 'RSA-OAEP') {
    return `RSA, ${a.modulusLength ?? '?'}-bit`
  }
  if (a.name === 'ECDSA' || a.name === 'ECDH') {
    return `EC (${a.namedCurve ?? 'unknown curve'})`
  }
  if (a.name === 'Ed25519' || a.name === 'Ed448') {
    return a.name
  }
  return a.name
}

function describeSignatureAlgorithm(alg: Algorithm): string {
  const a = alg as Algorithm & { hash?: { name: string } }
  return a.hash ? `${a.name} with ${a.hash.name}` : a.name
}

export interface DecodedCertificate {
  subject: string
  issuer: string
  serialNumber: string
  version: string | null
  notBefore: Date
  notAfter: Date
  signatureAlgorithm: string
  publicKeySummary: string
  sha1Fingerprint: string
  sha256Fingerprint: string
  isSelfSigned: boolean
  isCA: boolean | null
  pathLength: number | null
  keyUsages: string[]
  extendedKeyUsages: string[]
  subjectAltNames: string[]
}

export interface X509DecodeResult {
  cert: DecodedCertificate | null
  error: string | null
}

export async function decodeCertificate(pem: string): Promise<X509DecodeResult> {
  if (!pem.trim()) return { cert: null, error: null }

  let cert: x509.X509Certificate
  try {
    cert = new x509.X509Certificate(pem.trim())
  } catch (e) {
    return { cert: null, error: e instanceof Error ? e.message.split('\n')[0] : "Couldn't parse that as an X.509 certificate." }
  }

  let version: string | null = null
  try {
    const text = (await cert.toTextObject()) as { Data?: { Version?: string } }
    version = text.Data?.Version ?? null
  } catch {
    version = null
  }

  const basicConstraints = cert.getExtension(x509.BasicConstraintsExtension)
  const keyUsageExt = cert.getExtension(x509.KeyUsagesExtension)
  const ekuExt = cert.getExtension(x509.ExtendedKeyUsageExtension)
  const sanExt = cert.getExtension(x509.SubjectAlternativeNameExtension)

  const keyUsages = keyUsageExt
    ? KEY_USAGE_FLAGS.filter(([flag]) => (keyUsageExt.usages & flag) === flag).map(([, name]) => name)
    : []
  const extendedKeyUsages = ekuExt ? ekuExt.usages.map((oid) => EKU_NAMES[String(oid)] ?? String(oid)) : []
  const subjectAltNames = sanExt ? sanExt.names.items.map((item) => `${item.type}: ${item.value}`) : []

  let sha1Fingerprint = ''
  let sha256Fingerprint = ''
  try {
    ;[sha1Fingerprint, sha256Fingerprint] = await Promise.all([
      cert.getThumbprint('SHA-1').then(hexFingerprint),
      cert.getThumbprint('SHA-256').then(hexFingerprint),
    ])
  } catch {
    // Fingerprints are a nice-to-have; if hashing fails for some reason the
    // rest of the certificate's fields are still worth showing.
  }

  let isSelfSigned = false
  try {
    isSelfSigned = await cert.isSelfSigned()
  } catch {
    isSelfSigned = false
  }

  return {
    cert: {
      subject: cert.subject,
      issuer: cert.issuer,
      serialNumber: cert.serialNumber,
      version,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter,
      signatureAlgorithm: describeSignatureAlgorithm(cert.signatureAlgorithm),
      publicKeySummary: describePublicKey(cert.publicKey.algorithm),
      sha1Fingerprint,
      sha256Fingerprint,
      isSelfSigned,
      isCA: basicConstraints ? basicConstraints.ca : null,
      pathLength: basicConstraints?.pathLength ?? null,
      keyUsages,
      extendedKeyUsages,
      subjectAltNames,
    },
    error: null,
  }
}
