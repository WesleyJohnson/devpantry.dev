// Per-codepoint iteration via [...text] uses the string iterator protocol,
// which is surrogate-pair aware — an astral character like an emoji is
// correctly yielded as one codepoint, not the two UTF-16 code units it's
// stored as. Categorization uses native RegExp Unicode property escapes
// (\p{...}), so it needs no bundled Unicode database and is exactly as
// accurate as the browser's own Unicode tables.

export type UnicodeCategory =
  | 'Letter'
  | 'Mark'
  | 'Number'
  | 'Punctuation'
  | 'Symbol'
  | 'Separator'
  | 'Control'
  | 'Other'

const CATEGORY_PATTERNS: [UnicodeCategory, RegExp][] = [
  ['Letter', /\p{L}/u],
  ['Mark', /\p{M}/u],
  ['Number', /\p{N}/u],
  ['Punctuation', /\p{P}/u],
  ['Symbol', /\p{S}/u],
  ['Separator', /\p{Z}/u],
  ['Control', /\p{C}/u],
]

// A short, curated set of characters that are specifically confusing when
// invisible or easily mistaken for a plain space/hyphen — not an attempt at
// a full Unicode name database, just the ones people actually get bitten by.
const KNOWN_NAMES: Record<number, string> = {
  0x00: 'NULL',
  0x09: 'TAB',
  0x0a: 'LINE FEED',
  0x0d: 'CARRIAGE RETURN',
  0x20: 'SPACE',
  0xa0: 'NO-BREAK SPACE',
  0x200b: 'ZERO WIDTH SPACE',
  0x200c: 'ZERO WIDTH NON-JOINER',
  0x200d: 'ZERO WIDTH JOINER',
  0x200e: 'LEFT-TO-RIGHT MARK',
  0x200f: 'RIGHT-TO-LEFT MARK',
  0x2011: 'NON-BREAKING HYPHEN',
  0x2018: 'LEFT SINGLE QUOTATION MARK',
  0x2019: 'RIGHT SINGLE QUOTATION MARK',
  0x201c: 'LEFT DOUBLE QUOTATION MARK',
  0x201d: 'RIGHT DOUBLE QUOTATION MARK',
  0x2013: 'EN DASH',
  0x2014: 'EM DASH',
  0x2026: 'HORIZONTAL ELLIPSIS',
  0xfeff: 'ZERO WIDTH NO-BREAK SPACE (BOM)',
}

export interface CodepointInfo {
  char: string
  codepoint: number
  hex: string
  decimal: number
  utf8Bytes: string
  utf16Units: string
  category: UnicodeCategory
  name: string | null
  htmlEntityDecimal: string
  htmlEntityHex: string
}

function categorize(char: string): UnicodeCategory {
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(char)) return category
  }
  return 'Other'
}

function utf8Hex(char: string): string {
  return [...new TextEncoder().encode(char)].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

function utf16Hex(char: string): string {
  const units: string[] = []
  for (let i = 0; i < char.length; i++) {
    units.push(char.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase())
  }
  return units.join(' ')
}

export function inspectCodepoint(char: string): CodepointInfo {
  const codepoint = char.codePointAt(0) ?? 0
  const hex = codepoint.toString(16).toUpperCase().padStart(4, '0')
  return {
    char,
    codepoint,
    hex: `U+${hex}`,
    decimal: codepoint,
    utf8Bytes: utf8Hex(char),
    utf16Units: utf16Hex(char),
    category: categorize(char),
    name: KNOWN_NAMES[codepoint] ?? null,
    htmlEntityDecimal: `&#${codepoint};`,
    htmlEntityHex: `&#x${hex};`,
  }
}

export interface InspectResult {
  codepoints: CodepointInfo[]
  codepointCount: number
  graphemeCount: number
  utf8ByteLength: number
  utf16UnitLength: number
}

// Grapheme clusters are the "visual characters" a user would count — a
// flag emoji or a family emoji is one grapheme made of several codepoints —
// counted separately from raw codepoints specifically so that distinction
// is visible rather than hidden.
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null

export function inspectText(text: string): InspectResult {
  const codepoints = [...text].map(inspectCodepoint)
  const graphemeCount = segmenter ? [...segmenter.segment(text)].length : codepoints.length
  return {
    codepoints,
    codepointCount: codepoints.length,
    graphemeCount,
    utf8ByteLength: new TextEncoder().encode(text).length,
    utf16UnitLength: text.length,
  }
}
