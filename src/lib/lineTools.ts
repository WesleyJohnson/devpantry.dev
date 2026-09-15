export type SortMode = 'none' | 'asc' | 'desc'

export interface LineOptions {
  sortMode: SortMode
  caseInsensitive: boolean
  naturalSort: boolean
  dedupe: boolean
  trimLines: boolean
  removeEmpty: boolean
}

// Numeric-aware comparison so "item2" sorts before "item10" — plain string
// comparison would put "item10" first since "1" < "2" as characters.
function naturalCompare(a: string, b: string): number {
  const splitPattern = /(\d+)|(\D+)/g
  const ap = a.match(splitPattern) ?? []
  const bp = b.match(splitPattern) ?? []
  const len = Math.max(ap.length, bp.length)
  for (let i = 0; i < len; i++) {
    const x = ap[i] ?? ''
    const y = bp[i] ?? ''
    if (x === y) continue
    const xNum = /^\d+$/.test(x)
    const yNum = /^\d+$/.test(y)
    if (xNum && yNum) {
      const diff = Number(x) - Number(y)
      if (diff !== 0) return diff
    } else if (x !== y) {
      return x < y ? -1 : 1
    }
  }
  return 0
}

export function processLines(input: string, options: LineOptions): string {
  let lines = input.split(/\r\n|\r|\n/)

  if (options.trimLines) lines = lines.map((l) => l.trim())
  if (options.removeEmpty) lines = lines.filter((l) => l.trim() !== '')

  if (options.dedupe) {
    const seen = new Set<string>()
    lines = lines.filter((l) => {
      const key = options.caseInsensitive ? l.toLowerCase() : l
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  if (options.sortMode !== 'none') {
    const compare = (a: string, b: string) => {
      const x = options.caseInsensitive ? a.toLowerCase() : a
      const y = options.caseInsensitive ? b.toLowerCase() : b
      if (options.naturalSort) return naturalCompare(x, y)
      return x < y ? -1 : x > y ? 1 : 0
    }
    lines = [...lines].sort(compare)
    if (options.sortMode === 'desc') lines.reverse()
  }

  return lines.join('\n')
}

export function countLines(text: string): number {
  return text === '' ? 0 : text.split(/\r\n|\r|\n/).length
}
