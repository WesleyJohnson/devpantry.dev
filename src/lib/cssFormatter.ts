import { findTopLevelChar, skipString, splitTopLevel } from '@/lib/textScan'

export type CssNode =
  | { type: 'comment'; text: string }
  | { type: 'declaration'; property: string; value: string }
  | { type: 'rule'; selector: string; children: CssNode[] }
  | { type: 'at-rule'; prelude: string; children: CssNode[] | null }

class ParseError extends Error {}

class Cursor {
  pos = 0
  text: string

  constructor(text: string) {
    this.text = text
  }

  get done(): boolean {
    return this.pos >= this.text.length
  }

  peek(): string {
    return this.text[this.pos]
  }

  skipWs() {
    while (!this.done && /\s/.test(this.peek())) this.pos++
  }
}

function collapseWs(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function parseComment(cursor: Cursor, text: string): { type: 'comment'; text: string } {
  const start = cursor.pos
  const end = text.indexOf('*/', cursor.pos + 2)
  cursor.pos = end === -1 ? text.length : end + 2
  return { type: 'comment', text: text.slice(start, cursor.pos) }
}

// Reads raw text up to (not including) the next top-level '{', '}', or ';',
// skipping over quoted strings, comments, and parenthesised/bracketed spans
// so a `;` inside a quoted attribute selector or a `:` inside `url(a:b)`
// never gets mistaken for a structural separator.
function readChunk(cursor: Cursor, text: string): { chunk: string; stop: string | null } {
  const start = cursor.pos
  let depth = 0
  while (!cursor.done) {
    const ch = text[cursor.pos]
    if (ch === '"' || ch === "'") {
      cursor.pos = skipString(text, cursor.pos) + 1
      continue
    }
    if (ch === '/' && text[cursor.pos + 1] === '*') {
      const end = text.indexOf('*/', cursor.pos + 2)
      cursor.pos = end === -1 ? text.length : end + 2
      continue
    }
    if (ch === '(' || ch === '[') {
      depth++
      cursor.pos++
      continue
    }
    if (ch === ')' || ch === ']') {
      depth--
      cursor.pos++
      continue
    }
    if (ch === '{') {
      if (depth === 0) return { chunk: text.slice(start, cursor.pos), stop: '{' }
      depth++
      cursor.pos++
      continue
    }
    if (ch === '}') {
      if (depth === 0) return { chunk: text.slice(start, cursor.pos), stop: '}' }
      depth--
      cursor.pos++
      continue
    }
    if (ch === ';' && depth === 0) {
      return { chunk: text.slice(start, cursor.pos), stop: ';' }
    }
    cursor.pos++
  }
  return { chunk: text.slice(start, cursor.pos), stop: null }
}

function parseDeclarationOrAtStatement(raw: string): CssNode {
  const trimmed = collapseWs(raw)
  if (trimmed.startsWith('@')) return { type: 'at-rule', prelude: trimmed, children: null }
  const colonIdx = findTopLevelChar(trimmed, ':')
  if (colonIdx === -1) throw new ParseError(`Expected a "property: value" declaration, got "${trimmed}".`)
  return {
    type: 'declaration',
    property: trimmed.slice(0, colonIdx).trim(),
    value: trimmed.slice(colonIdx + 1).trim(),
  }
}

function parseNode(cursor: Cursor, text: string): CssNode | null {
  cursor.skipWs()
  if (cursor.done || cursor.peek() === '}') return null
  if (text.startsWith('/*', cursor.pos)) return parseComment(cursor, text)

  const { chunk, stop } = readChunk(cursor, text)
  const trimmed = collapseWs(chunk)

  if (stop === '{') {
    cursor.pos++ // consume '{'
    const children = parseChildren(cursor, text)
    if (cursor.done) throw new ParseError(`Unterminated block — missing a closing } for "${trimmed}".`)
    cursor.pos++ // consume matching '}'
    if (trimmed.startsWith('@')) return { type: 'at-rule', prelude: trimmed, children }
    if (!trimmed) throw new ParseError('Found a { with no selector before it.')
    return { type: 'rule', selector: trimmed, children }
  }

  if (stop === ';') {
    cursor.pos++ // consume ';'
    if (!trimmed) return parseNode(cursor, text) // stray ";"
    return parseDeclarationOrAtStatement(chunk)
  }

  // stop is '}' or null (end of input): a trailing declaration with no
  // semicolon (valid CSS for the last declaration in a block) or, at the
  // true top level, leftover/malformed text.
  if (!trimmed) return null
  return parseDeclarationOrAtStatement(chunk)
}

function parseChildren(cursor: Cursor, text: string): CssNode[] {
  const nodes: CssNode[] = []
  while (true) {
    cursor.skipWs()
    if (cursor.done || cursor.peek() === '}') break
    const node = parseNode(cursor, text)
    if (!node) break
    nodes.push(node)
  }
  return nodes
}

export interface CssParseResult {
  nodes: CssNode[]
  error: string | null
}

export function parseCss(input: string): CssParseResult {
  const cursor = new Cursor(input)
  try {
    const nodes = parseChildren(cursor, input)
    cursor.skipWs()
    if (!cursor.done) {
      throw new ParseError(`Unexpected "${input[cursor.pos]}" — braces look unbalanced.`)
    }
    return { nodes, error: null }
  } catch (e) {
    if (e instanceof ParseError) return { nodes: [], error: e.message }
    throw e
  }
}

function splitSelectorList(selector: string): string[] {
  return splitTopLevel(selector, ',').map((s) => s.trim())
}

export function beautifyNodes(nodes: CssNode[], depth = 0): string {
  const pad = '  '.repeat(depth)
  const lines: string[] = []
  for (const node of nodes) {
    if (node.type === 'comment') {
      lines.push(`${pad}${node.text}`)
    } else if (node.type === 'declaration') {
      lines.push(`${pad}${node.property}: ${node.value};`)
    } else if (node.type === 'at-rule' && node.children === null) {
      lines.push(`${pad}${node.prelude};`)
    } else if (node.type === 'rule') {
      const header = splitSelectorList(node.selector).join(`,\n${pad}`)
      lines.push(`${pad}${header} {`)
      const body = beautifyNodes(node.children, depth + 1)
      if (body) lines.push(body)
      lines.push(`${pad}}`)
    } else {
      lines.push(`${pad}${node.prelude} {`)
      const body = beautifyNodes(node.children ?? [], depth + 1)
      if (body) lines.push(body)
      lines.push(`${pad}}`)
    }
  }
  return lines.join('\n')
}

export function minifyNodes(nodes: CssNode[]): string {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'comment') continue // comments carry no runtime meaning — always safe to drop
    if (node.type === 'declaration') {
      out += `${node.property}:${node.value};`
    } else if (node.type === 'at-rule' && node.children === null) {
      out += `${node.prelude};`
    } else if (node.type === 'rule') {
      out += `${splitSelectorList(node.selector).join(',')}{${minifyNodes(node.children)}}`
    } else {
      out += `${node.prelude}{${minifyNodes(node.children ?? [])}}`
    }
  }
  // A trailing ";" right before "}" is always optional in CSS, so this is
  // safe to drop even though the declaration-render step above always adds
  // one — cheaper than special-casing "is this the last declaration".
  return out.replace(/;}/g, '}')
}

export interface CssFormatResult {
  output: string
  error: string | null
}

export function formatCss(input: string, mode: 'beautify' | 'minify'): CssFormatResult {
  if (!input.trim()) return { output: '', error: null }
  const { nodes, error } = parseCss(input)
  if (error) return { output: '', error }
  return { output: mode === 'beautify' ? beautifyNodes(nodes) : minifyNodes(nodes), error: null }
}
