export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  sentences: number
  bytes: number
  uniqueCharacters: number
  longestLine: number
  readingTimeMinutes: number
}

// A rough estimate, not a linguistic sentence splitter: counts fully
// terminated .!? chunks, plus one more for a trailing fragment that never
// got terminal punctuation, so it does not silently drop unfinished text.
function countSentences(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  const matches = trimmed.match(/[^.!?]+[.!?]+(\s|$)/g) ?? []
  const consumedLength = matches.join('').length
  const remainder = trimmed.slice(consumedLength).trim()
  return matches.length + (remainder ? 1 : 0)
}

const AVERAGE_WORDS_PER_MINUTE = 200

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim()
  const lineArr = text.split(/\r\n|\r|\n/)
  const words = trimmed ? trimmed.split(/\s+/).length : 0

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words,
    lines: text === '' ? 0 : lineArr.length,
    sentences: countSentences(text),
    bytes: new TextEncoder().encode(text).length,
    uniqueCharacters: new Set(text.replace(/\s/g, '')).size,
    longestLine: lineArr.reduce((max, line) => Math.max(max, line.length), 0),
    readingTimeMinutes: words / AVERAGE_WORDS_PER_MINUTE,
  }
}
