// A curated set of the HTML named character references developers actually
// run into (not the full HTML5 table of 2000+, which is mostly obscure
// MathML symbols). Numeric entities (&#39; / &#x27;) are handled separately
// below and cover every Unicode code point exactly, regardless of this
// table's size — only named-entity coverage is bounded.
export const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  curren: '¤',
  sect: '§',
  para: '¶',
  middot: '·',
  laquo: '«',
  raquo: '»',
  iexcl: '¡',
  iquest: '¿',
  szlig: 'ß',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  yuml: 'ÿ',
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Auml: 'Ä',
  Aring: 'Å',
  AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Euml: 'Ë',
  Igrave: 'Ì',
  Iacute: 'Í',
  Icirc: 'Î',
  Iuml: 'Ï',
  Ntilde: 'Ñ',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ouml: 'Ö',
  Oslash: 'Ø',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Uuml: 'Ü',
  Yacute: 'Ý',
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
  infin: '∞',
  ne: '≠',
  le: '≤',
  ge: '≥',
  sum: '∑',
  radic: '√',
}

const REVERSE_NAMED = new Map<string, string>()
for (const [name, char] of Object.entries(NAMED_ENTITIES)) {
  if (!REVERSE_NAMED.has(char)) REVERSE_NAMED.set(char, name)
}

export function htmlEntityEncode(text: string, encodeNonAscii: boolean): string {
  let out = ''
  for (const ch of text) {
    if (ch === '&') out += '&amp;'
    else if (ch === '<') out += '&lt;'
    else if (ch === '>') out += '&gt;'
    else if (ch === '"') out += '&quot;'
    else if (ch === "'") out += '&#39;'
    else if (encodeNonAscii && ch.codePointAt(0)! > 127) {
      const named = REVERSE_NAMED.get(ch)
      out += named ? `&${named};` : `&#${ch.codePointAt(0)};`
    } else {
      out += ch
    }
  }
  return out
}

export interface DecodeResult {
  output: string
  warnings: string[]
}

const ENTITY_PATTERN = /&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g

export function htmlEntityDecode(text: string): DecodeResult {
  const unknown = new Set<string>()
  const output = text.replace(ENTITY_PATTERN, (match, entity: string) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X'
      const codeStr = isHex ? entity.slice(2) : entity.slice(1)
      const code = parseInt(codeStr, isHex ? 16 : 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    const resolved = NAMED_ENTITIES[entity]
    if (resolved === undefined) {
      unknown.add(entity)
      return match
    }
    return resolved
  })

  const warnings =
    unknown.size > 0
      ? [`Unrecognized entities left as-is: ${[...unknown].map((e) => `&${e};`).join(', ')}`]
      : []

  return { output, warnings }
}
