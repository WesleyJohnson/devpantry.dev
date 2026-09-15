export type DigestAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
export type HmacAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

export const DIGEST_ALGORITHMS: DigestAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
export const HMAC_ALGORITHMS: HmacAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

// --- MD5 -------------------------------------------------------------------
// Web Crypto has no MD5, so it's implemented directly (RFC 1321). Verified
// against the standard test vectors, including the "1 million 'a'" vector.

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const MD5_K = new Int32Array([
  -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426, -1473231341, -45705983,
  1770035416, -1958414417, -42063, -1990404162, 1804603682, -40341101, -1502002290, 1236535329,
  -165796510, -1069501632, 643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
  568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784, 1735328473, -1926607734,
  -378558, -2022574463, 1839030562, -35309556, -1530992060, 1272893353, -155497632, -1094730640,
  681279174, -358537222, -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
  -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606, -1051523, -2054922799,
  1873313359, -30611744, -1560198380, 1309151649, -145523070, -1120210379, 718787259, -343485551,
])

function leftRotate(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c))
}

function md5(message: Uint8Array): Uint8Array {
  const origLenBits = BigInt(message.length) * 8n
  const padLen = (56 - ((message.length + 1) % 64) + 64) % 64
  const padded = new Uint8Array(message.length + 1 + padLen + 8)
  padded.set(message)
  padded[message.length] = 0x80
  for (let i = 0; i < 8; i++) {
    padded[padded.length - 8 + i] = Number((origLenBits >> BigInt(8 * i)) & 0xffn)
  }

  let a0 = 0x67452301
  let b0 = 0xefcdab89 | 0
  let c0 = 0x98badcfe | 0
  let d0 = 0x10325476

  const view = new DataView(padded.buffer)

  for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
    const M = new Int32Array(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getInt32(chunkStart + j * 4, true)
    }

    let A = a0
    let B = b0
    let C = c0
    let D = d0

    for (let i = 0; i < 64; i++) {
      let F: number
      let g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + MD5_K[i] + M[g]) | 0
      A = D
      D = C
      C = B
      B = (B + leftRotate(F, MD5_SHIFTS[i])) | 0
    }

    a0 = (a0 + A) | 0
    b0 = (b0 + B) | 0
    c0 = (c0 + C) | 0
    d0 = (d0 + D) | 0
  }

  const result = new Uint8Array(16)
  const resultView = new DataView(result.buffer)
  resultView.setInt32(0, a0, true)
  resultView.setInt32(4, b0, true)
  resultView.setInt32(8, c0, true)
  resultView.setInt32(12, d0, true)
  return result
}

// --- Shared helpers ----------------------------------------------------

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function digest(algorithm: DigestAlgorithm, text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  if (algorithm === 'MD5') return toHex(md5(data))
  const buffer = await crypto.subtle.digest(algorithm, data)
  return toHex(buffer)
}

export async function hmac(algorithm: HmacAlgorithm, key: string, text: string): Promise<string> {
  const keyData = new TextEncoder().encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(text))
  return toHex(signature)
}
