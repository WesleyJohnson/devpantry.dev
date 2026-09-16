// A token labeler, not a sentence generator: walks the pattern source and
// classifies each span against the fixed ECMAScript regex grammar, with a
// short static description per token. It deliberately does not try to
// compose a natural-language explanation of what the whole pattern does —
// that requires understanding how tokens interact (nesting, alternation
// scope, backtracking), which is a much larger and riskier undertaking.
// Labeling individual tokens is bounded and verifiable; composing meaning
// across them is not.

export type TokenKind =
  | 'literal'
  | 'charClass'
  | 'escape'
  | 'anchor'
  | 'quantifier'
  | 'groupOpen'
  | 'groupClose'
  | 'alternation'
  | 'dot'
  | 'backreference'

export interface PatternToken {
  kind: TokenKind
  text: string
  start: number
  end: number
  description: string
}

const ESCAPE_DESCRIPTIONS: Record<string, string> = {
  d: 'digit (0-9)',
  D: 'not a digit',
  w: 'word character (letter, digit, or underscore)',
  W: 'not a word character',
  s: 'whitespace character',
  S: 'not a whitespace character',
  n: 'newline',
  r: 'carriage return',
  t: 'tab',
  v: 'vertical tab',
  f: 'form feed',
  '0': 'null character',
}

function describeQuantifier(q: string, lazy: boolean): string {
  const suffix = lazy ? ', lazy (as few as possible)' : ', greedy (as many as possible)'
  if (q === '*') return `zero or more${suffix}`
  if (q === '+') return `one or more${suffix}`
  if (q === '?') return 'zero or one'
  const braceMatch = /^\{(\d+)(,(\d*))?\}$/.exec(q)
  if (braceMatch) {
    const min = braceMatch[1]
    if (braceMatch[2] === undefined) return `exactly ${min} time${min === '1' ? '' : 's'}`
    const max = braceMatch[3]
    if (max === '') return `${min} or more times${suffix}`
    return `between ${min} and ${max} times${suffix}`
  }
  return 'quantifier'
}

function describeCharClass(text: string): string {
  const negated = text.startsWith('[^')
  const body = text.slice(negated ? 2 : 1, -1)
  const parts: string[] = []
  let i = 0
  while (i < body.length) {
    if (body[i] === '\\') {
      const next = body[i + 1] ?? ''
      parts.push(ESCAPE_DESCRIPTIONS[next] ?? `"${next}"`)
      i += 2
      continue
    }
    if (body[i + 1] === '-' && body[i + 2] && body[i + 2] !== ']') {
      parts.push(`${body[i]}-${body[i + 2]}`)
      i += 3
      continue
    }
    parts.push(`"${body[i]}"`)
    i++
  }
  const list = parts.length > 0 ? parts.join(', ') : '(empty)'
  return negated ? `any character NOT in: ${list}` : `any character in: ${list}`
}

const QUANTIFIER_START = new Set(['*', '+', '?', '{'])
const SPECIAL_CHARS = new Set(['[', '\\', '^', '$', '.', '|', '(', ')', '{', '}', '*', '+', '?'])

export function tokenizePattern(pattern: string): PatternToken[] {
  const tokens: PatternToken[] = []
  let i = 0

  function push(kind: TokenKind, start: number, end: number, description: string) {
    tokens.push({ kind, text: pattern.slice(start, end), start, end, description })
  }

  while (i < pattern.length) {
    const ch = pattern[i]

    if (ch === '[') {
      const start = i
      i++
      if (pattern[i] === '^') i++
      if (pattern[i] === ']') i++ // a ']' right after '[' or '[^' is a literal, not the closer
      while (i < pattern.length && pattern[i] !== ']') {
        i += pattern[i] === '\\' ? 2 : 1
      }
      i++ // consume the closing ']' (or run off the end of an unterminated class)
      const end = Math.min(i, pattern.length)
      push('charClass', start, end, describeCharClass(pattern.slice(start, end)))
      continue
    }

    if (ch === '\\') {
      const start = i
      const next = pattern[i + 1] ?? ''
      i += 2
      if (next === 'b' || next === 'B') {
        push('anchor', start, i, next === 'b' ? 'word boundary' : 'not a word boundary')
      } else if (/[1-9]/.test(next)) {
        while (/[0-9]/.test(pattern[i] ?? '')) i++
        push('backreference', start, i, `backreference to group ${pattern.slice(start + 1, i)}`)
      } else if (next === 'k' && pattern[i] === '<') {
        const nameEnd = pattern.indexOf('>', i)
        if (nameEnd !== -1) {
          i = nameEnd + 1
          push('backreference', start, i, `named backreference to group "${pattern.slice(start + 3, nameEnd)}"`)
        } else {
          push('escape', start, i, 'escaped character')
        }
      } else if (Object.prototype.hasOwnProperty.call(ESCAPE_DESCRIPTIONS, next)) {
        push('escape', start, i, ESCAPE_DESCRIPTIONS[next])
      } else {
        push('escape', start, i, `literal "${next}"`)
      }
      continue
    }

    if (ch === '^' || ch === '$') {
      push('anchor', i, i + 1, ch === '^' ? 'start of string/line' : 'end of string/line')
      i++
      continue
    }

    if (ch === '.') {
      push('dot', i, i + 1, 'any character except line terminators')
      i++
      continue
    }

    if (ch === '|') {
      push('alternation', i, i + 1, 'alternation (OR)')
      i++
      continue
    }

    if (ch === '(') {
      const start = i
      if (pattern.startsWith('(?:', i)) {
        i += 3
        push('groupOpen', start, i, 'non-capturing group')
      } else if (pattern.startsWith('(?=', i)) {
        i += 3
        push('groupOpen', start, i, 'positive lookahead')
      } else if (pattern.startsWith('(?!', i)) {
        i += 3
        push('groupOpen', start, i, 'negative lookahead')
      } else if (pattern.startsWith('(?<=', i)) {
        i += 4
        push('groupOpen', start, i, 'positive lookbehind')
      } else if (pattern.startsWith('(?<!', i)) {
        i += 4
        push('groupOpen', start, i, 'negative lookbehind')
      } else if (pattern.startsWith('(?<', i)) {
        const nameEnd = pattern.indexOf('>', i)
        if (nameEnd !== -1) {
          i = nameEnd + 1
          push('groupOpen', start, i, `named capturing group "${pattern.slice(start + 3, nameEnd)}"`)
        } else {
          i++
          push('groupOpen', start, i, 'capturing group')
        }
      } else {
        i++
        push('groupOpen', start, i, 'capturing group')
      }
      continue
    }

    if (ch === ')') {
      push('groupClose', i, i + 1, 'end of group')
      i++
      continue
    }

    if (QUANTIFIER_START.has(ch)) {
      const start = i
      let quant = ch
      if (ch === '{') {
        const closeIdx = pattern.indexOf('}', i)
        const candidate = closeIdx !== -1 ? pattern.slice(i, closeIdx + 1) : ''
        if (/^\{\d+(,\d*)?\}$/.test(candidate)) {
          quant = candidate
          i = closeIdx + 1
        } else {
          push('literal', i, i + 1, 'literal "{"')
          i++
          continue
        }
      } else {
        i++
      }
      const lazy = pattern[i] === '?'
      if (lazy) i++
      push('quantifier', start, i, describeQuantifier(quant, lazy))
      continue
    }

    const start = i
    while (i < pattern.length && !SPECIAL_CHARS.has(pattern[i])) i++
    if (i === start) i++
    push('literal', start, i, `literal text "${pattern.slice(start, i)}"`)
  }

  return tokens
}
