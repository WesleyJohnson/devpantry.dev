// Pure arithmetic on the parsed address — accurate by construction, same bar
// as Number Base Converter or Color Converter. IPv4 fits comfortably in a
// JS number using unsigned bitwise ops (`>>> 0`); IPv6's 128-bit address
// space needs BigInt since no JS numeric type holds it exactly.

export interface Ipv4Result {
  family: 4
  ip: string
  prefix: number
  netmask: string
  wildcardMask: string
  network: string
  broadcast: string | null
  firstHost: string
  lastHost: string
  totalAddresses: number
  usableHosts: number
  ipClass: string
  isPrivate: boolean
  binaryIp: string
  binaryMask: string
}

export interface Ipv6Result {
  family: 6
  ip: string
  prefix: number
  network: string
  lastAddress: string
  totalAddresses: string // decimal string — can exceed Number.MAX_SAFE_INTEGER
}

export type SubnetResult = Ipv4Result | Ipv6Result

export interface SubnetCalcResult {
  result: SubnetResult | null
  error: string | null
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.')
  if (parts.length !== 4) throw new Error(`"${ip}" is not a valid IPv4 address — expected 4 dot-separated octets.`)
  let int = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) throw new Error(`"${ip}" is not a valid IPv4 address — "${part}" is not a valid octet.`)
    const n = Number(part)
    if (n > 255) throw new Error(`"${ip}" is not a valid IPv4 address — octet "${part}" is greater than 255.`)
    int = (int << 8) | n
  }
  return int >>> 0
}

function intToIpv4(int: number): string {
  return [24, 16, 8, 0].map((shift) => (int >>> shift) & 0xff).join('.')
}

function toBinaryOctets(int: number): string {
  return [24, 16, 8, 0].map((shift) => ((int >>> shift) & 0xff).toString(2).padStart(8, '0')).join('.')
}

function classifyIpv4(int: number): string {
  const first = (int >>> 24) & 0xff
  if (first < 128) return 'A'
  if (first < 192) return 'B'
  if (first < 224) return 'C'
  if (first < 240) return 'D (multicast)'
  return 'E (reserved)'
}

const PRIVATE_RANGES_V4: [string, number][] = [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
]

function isPrivateIpv4(int: number): boolean {
  return PRIVATE_RANGES_V4.some(([base, prefix]) => {
    const baseInt = ipv4ToInt(base)
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    return (int & mask) >>> 0 === (baseInt & mask) >>> 0
  })
}

function calculateIpv4(ip: string, prefix: number): Ipv4Result {
  if (prefix < 0 || prefix > 32) throw new Error(`IPv4 prefix must be between 0 and 32, got /${prefix}.`)

  const ipInt = ipv4ToInt(ip)
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const wildcardInt = ~maskInt >>> 0
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | wildcardInt) >>> 0
  const totalAddresses = 2 ** (32 - prefix)

  let firstHost: string
  let lastHost: string
  let usableHosts: number
  let broadcast: string | null

  if (prefix === 32) {
    firstHost = intToIpv4(networkInt)
    lastHost = firstHost
    usableHosts = 1
    broadcast = null
  } else if (prefix === 31) {
    // RFC 3021 point-to-point link — no network/broadcast reservation, both addresses usable
    firstHost = intToIpv4(networkInt)
    lastHost = intToIpv4(broadcastInt)
    usableHosts = 2
    broadcast = null
  } else {
    firstHost = intToIpv4((networkInt + 1) >>> 0)
    lastHost = intToIpv4((broadcastInt - 1) >>> 0)
    usableHosts = totalAddresses - 2
    broadcast = intToIpv4(broadcastInt)
  }

  return {
    family: 4,
    ip,
    prefix,
    netmask: intToIpv4(maskInt),
    wildcardMask: intToIpv4(wildcardInt),
    network: intToIpv4(networkInt),
    broadcast,
    firstHost,
    lastHost,
    totalAddresses,
    usableHosts,
    ipClass: classifyIpv4(ipInt),
    isPrivate: isPrivateIpv4(ipInt),
    binaryIp: toBinaryOctets(ipInt),
    binaryMask: toBinaryOctets(maskInt),
  }
}

// --- IPv6 ---------------------------------------------------------------

function ipv6ToBigInt(ip: string): bigint {
  let address = ip

  // Trailing embedded IPv4 (e.g. "::ffff:192.168.1.1") — translate the
  // dotted-decimal tail into two hex groups before parsing the rest as
  // ordinary IPv6 groups.
  const v4TailMatch = /(?:^|:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(address)
  if (v4TailMatch) {
    const v4Int = ipv4ToInt(v4TailMatch[1])
    const hi = ((v4Int >>> 16) & 0xffff).toString(16)
    const lo = (v4Int & 0xffff).toString(16)
    address = address.slice(0, address.length - v4TailMatch[1].length) + `${hi}:${lo}`
  }

  if (address.includes(':::') || (address.match(/::/g) ?? []).length > 1) {
    throw new Error(`"${ip}" is not a valid IPv6 address — "::" can appear at most once.`)
  }

  let head: string[]
  let tail: string[]
  if (address.includes('::')) {
    const [left, right] = address.split('::')
    head = left ? left.split(':') : []
    tail = right ? right.split(':') : []
  } else {
    head = address.split(':')
    tail = []
  }

  const missing = 8 - head.length - tail.length
  if (!address.includes('::') && missing !== 0) {
    throw new Error(`"${ip}" is not a valid IPv6 address — expected 8 groups, found ${head.length}.`)
  }
  if (address.includes('::') && missing < 0) {
    throw new Error(`"${ip}" is not a valid IPv6 address — too many groups for a "::" compression.`)
  }

  const groups = [...head, ...Array(Math.max(missing, 0)).fill('0'), ...tail]
  if (groups.length !== 8) {
    throw new Error(`"${ip}" is not a valid IPv6 address — expected 8 groups, found ${groups.length}.`)
  }

  let value = 0n
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      throw new Error(`"${ip}" is not a valid IPv6 address — "${group}" is not a valid hex group.`)
    }
    value = (value << 16n) | BigInt(parseInt(group, 16))
  }
  return value
}

function bigIntToIpv6(value: bigint): string {
  const groups: string[] = []
  for (let i = 7; i >= 0; i--) {
    const shift = BigInt(i * 16)
    groups.push(((value >> shift) & 0xffffn).toString(16))
  }

  // Compress the longest run of consecutive "0" groups into "::", per the
  // canonical RFC 5952 form — ties broken in favor of the earliest run.
  let bestStart = -1
  let bestLen = 0
  let curStart = -1
  let curLen = 0
  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0') {
      if (curStart === -1) curStart = i
      curLen++
      if (curLen > bestLen) {
        bestLen = curLen
        bestStart = curStart
      }
    } else {
      curStart = -1
      curLen = 0
    }
  }

  if (bestLen < 2) return groups.join(':')

  const before = groups.slice(0, bestStart).join(':')
  const after = groups.slice(bestStart + bestLen).join(':')
  return `${before}::${after}`
}

function calculateIpv6(ip: string, prefix: number): Ipv6Result {
  if (prefix < 0 || prefix > 128) throw new Error(`IPv6 prefix must be between 0 and 128, got /${prefix}.`)

  const addressValue = ipv6ToBigInt(ip)
  const fullMask = (1n << 128n) - 1n
  const maskValue = prefix === 0 ? 0n : (fullMask << BigInt(128 - prefix)) & fullMask
  const networkValue = addressValue & maskValue
  const lastValue = networkValue | (fullMask ^ maskValue)
  const totalAddresses = 2n ** BigInt(128 - prefix)

  return {
    family: 6,
    ip,
    prefix,
    network: bigIntToIpv6(networkValue),
    lastAddress: bigIntToIpv6(lastValue),
    totalAddresses: totalAddresses.toString(),
  }
}

export function calculateSubnet(input: string): SubnetCalcResult {
  const trimmed = input.trim()
  if (!trimmed) return { result: null, error: null }

  const slashIdx = trimmed.lastIndexOf('/')
  if (slashIdx === -1) {
    return { result: null, error: 'Expected CIDR notation, e.g. "192.168.1.0/24" or "2001:db8::/32".' }
  }
  const address = trimmed.slice(0, slashIdx)
  const prefixStr = trimmed.slice(slashIdx + 1)
  if (!/^\d+$/.test(prefixStr)) {
    return { result: null, error: `"/${prefixStr}" is not a valid prefix length.` }
  }
  const prefix = Number(prefixStr)

  try {
    const result = address.includes(':') ? calculateIpv6(address, prefix) : calculateIpv4(address, prefix)
    return { result, error: null }
  } catch (e) {
    return { result: null, error: e instanceof Error ? e.message : 'Invalid CIDR input.' }
  }
}
