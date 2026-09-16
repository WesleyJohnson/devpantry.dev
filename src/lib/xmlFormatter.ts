export interface XmlAttr {
  name: string
  rawValue: string // includes the surrounding quote characters, verbatim from input
}

export type XmlNode =
  | { type: 'element'; name: string; attrs: XmlAttr[]; selfClosing: boolean; children: XmlNode[] }
  | { type: 'text'; value: string }
  | { type: 'comment'; raw: string } // full "<!-- ... -->"
  | { type: 'cdata'; raw: string } // full "<![CDATA[ ... ]]>"
  | { type: 'pi'; raw: string } // processing instruction / XML declaration, full "<?...?>"
  | { type: 'doctype'; raw: string } // full "<!DOCTYPE ...>"

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
  startsWith(s: string): boolean {
    return this.text.startsWith(s, this.pos)
  }
  skipWs() {
    while (!this.done && /\s/.test(this.text[this.pos])) this.pos++
  }
}

const NAME_RE = /^[A-Za-z_:][\w.:-]*/

function readUntil(cursor: Cursor, terminator: string, label: string): string {
  const idx = cursor.text.indexOf(terminator, cursor.pos)
  if (idx === -1) throw new ParseError(`Unterminated ${label} — missing "${terminator}".`)
  const raw = cursor.text.slice(cursor.pos, idx + terminator.length)
  cursor.pos = idx + terminator.length
  return raw
}

// DOCTYPE can carry an internal subset in [...] which may itself contain a
// literal ">" (inside an <!ENTITY ...> declaration), so a naive indexOf(">")
// would truncate it early — track bracket depth and only stop at a ">" once
// back at depth 0.
function readDoctype(cursor: Cursor): string {
  const start = cursor.pos
  let depth = 0
  while (!cursor.done) {
    const ch = cursor.text[cursor.pos]
    if (ch === '[') depth++
    else if (ch === ']') depth--
    else if (ch === '>' && depth === 0) {
      cursor.pos++
      return cursor.text.slice(start, cursor.pos)
    }
    cursor.pos++
  }
  throw new ParseError('Unterminated <!DOCTYPE ...> — missing ">".')
}

function parseAttrs(cursor: Cursor): XmlAttr[] {
  const attrs: XmlAttr[] = []
  while (true) {
    cursor.skipWs()
    if (cursor.done || cursor.startsWith('/>') || cursor.startsWith('>')) return attrs
    const nameMatch = NAME_RE.exec(cursor.text.slice(cursor.pos))
    if (!nameMatch) throw new ParseError(`Expected an attribute name near "...${cursor.text.slice(cursor.pos, cursor.pos + 20)}".`)
    const name = nameMatch[0]
    cursor.pos += name.length
    cursor.skipWs()
    if (cursor.text[cursor.pos] !== '=') {
      throw new ParseError(`Attribute "${name}" is missing "=value" — XML requires an explicit value.`)
    }
    cursor.pos++
    cursor.skipWs()
    const quote = cursor.text[cursor.pos]
    if (quote !== '"' && quote !== "'") {
      throw new ParseError(`Attribute "${name}" value must be quoted with " or ' — XML does not allow bare values.`)
    }
    const closeIdx = cursor.text.indexOf(quote, cursor.pos + 1)
    if (closeIdx === -1) throw new ParseError(`Attribute "${name}" has an unterminated quoted value.`)
    const rawValue = cursor.text.slice(cursor.pos, closeIdx + 1)
    cursor.pos = closeIdx + 1
    attrs.push({ name, rawValue })
  }
}

function parseElement(cursor: Cursor): XmlNode {
  cursor.pos++ // consume '<'
  const nameMatch = NAME_RE.exec(cursor.text.slice(cursor.pos))
  if (!nameMatch) throw new ParseError(`Expected a tag name near "...${cursor.text.slice(cursor.pos, cursor.pos + 20)}".`)
  const name = nameMatch[0]
  cursor.pos += name.length
  const attrs = parseAttrs(cursor)
  cursor.skipWs()

  if (cursor.startsWith('/>')) {
    cursor.pos += 2
    return { type: 'element', name, attrs, selfClosing: true, children: [] }
  }
  if (cursor.text[cursor.pos] !== '>') {
    throw new ParseError(`Malformed tag <${name}> — expected ">" or "/>".`)
  }
  cursor.pos++ // consume '>'

  const children = parseNodes(cursor)
  if (cursor.done) throw new ParseError(`Unterminated element <${name}> — missing a matching </${name}>.`)

  cursor.pos += 2 // consume '</'
  const closeMatch = NAME_RE.exec(cursor.text.slice(cursor.pos))
  const closeName = closeMatch?.[0] ?? ''
  if (closeName !== name) {
    throw new ParseError(`Mismatched closing tag — expected </${name}> but found </${closeName || '?'}>.`)
  }
  cursor.pos += closeName.length
  cursor.skipWs()
  if (cursor.text[cursor.pos] !== '>') throw new ParseError(`Expected ">" to close </${name}>.`)
  cursor.pos++

  return { type: 'element', name, attrs, selfClosing: false, children }
}

function parseNode(cursor: Cursor): XmlNode {
  if (cursor.startsWith('<?')) return { type: 'pi', raw: readUntil(cursor, '?>', 'processing instruction') }
  if (cursor.startsWith('<!--')) return { type: 'comment', raw: readUntil(cursor, '-->', 'comment') }
  if (cursor.startsWith('<![CDATA[')) return { type: 'cdata', raw: readUntil(cursor, ']]>', 'CDATA section') }
  if (cursor.startsWith('<!DOCTYPE')) return { type: 'doctype', raw: readDoctype(cursor) }
  if (cursor.startsWith('<')) return parseElement(cursor)

  const nextTag = cursor.text.indexOf('<', cursor.pos)
  const end = nextTag === -1 ? cursor.text.length : nextTag
  const value = cursor.text.slice(cursor.pos, end)
  cursor.pos = end
  return { type: 'text', value }
}

function parseNodes(cursor: Cursor): XmlNode[] {
  const nodes: XmlNode[] = []
  while (!cursor.done && !cursor.startsWith('</')) {
    nodes.push(parseNode(cursor))
  }
  return nodes
}

export interface XmlParseResult {
  nodes: XmlNode[]
  error: string | null
}

export function parseXml(input: string): XmlParseResult {
  const cursor = new Cursor(input)
  try {
    const nodes = parseNodes(cursor)
    if (!cursor.done) {
      throw new ParseError('Found a closing tag with no matching open tag.')
    }
    const rootElements = nodes.filter((n) => n.type === 'element')
    if (rootElements.length === 0) throw new ParseError('No root element found.')
    if (rootElements.length > 1) throw new ParseError(`XML documents must have exactly one root element, found ${rootElements.length}.`)
    return { nodes, error: null }
  } catch (e) {
    if (e instanceof ParseError) return { nodes: [], error: e.message }
    throw e
  }
}

function renderAttrs(attrs: XmlAttr[]): string {
  return attrs.map((a) => ` ${a.name}=${a.rawValue}`).join('')
}

function renderOpenTag(node: Extract<XmlNode, { type: 'element' }>): string {
  return `<${node.name}${renderAttrs(node.attrs)}${node.selfClosing ? '/>' : '>'}`
}

// Exact, whitespace-preserving reconstruction of a node and its subtree —
// used both for minify's default case and for re-serializing mixed content
// (text interleaved with elements) without adding indentation that would
// change what the markup renders as.
function renderVerbatim(node: XmlNode): string {
  if (node.type === 'text') return node.value
  if (node.type === 'comment' || node.type === 'cdata' || node.type === 'pi' || node.type === 'doctype') {
    return node.raw
  }
  if (node.selfClosing) return renderOpenTag(node)
  return `${renderOpenTag(node)}${node.children.map(renderVerbatim).join('')}</${node.name}>`
}

function isBlankText(node: XmlNode): boolean {
  return node.type === 'text' && node.value.trim() === ''
}

export function beautifyNodes(nodes: XmlNode[], depth = 0): string {
  const pad = '  '.repeat(depth)
  const lines: string[] = []

  for (const node of nodes) {
    if (isBlankText(node)) continue
    if (node.type === 'text') {
      lines.push(`${pad}${node.value.trim()}`)
      continue
    }
    if (node.type !== 'element') {
      lines.push(`${pad}${node.raw}`)
      continue
    }

    if (node.selfClosing) {
      lines.push(`${pad}${renderOpenTag(node)}`)
      continue
    }

    const meaningful = node.children.filter((c) => !isBlankText(c))
    const hasElementChild = meaningful.some((c) => c.type === 'element')
    const hasNonBlankText = meaningful.some((c) => c.type === 'text')

    if (meaningful.length === 0) {
      lines.push(`${pad}${renderOpenTag(node)}</${node.name}>`)
    } else if (!hasElementChild && meaningful.length === 1 && meaningful[0].type === 'text') {
      lines.push(`${pad}${renderOpenTag(node)}${meaningful[0].value.trim()}</${node.name}>`)
    } else if (hasNonBlankText && hasElementChild) {
      // Mixed content: text and elements interleaved. Re-indenting the
      // children here would insert whitespace into what may be
      // human-readable prose (e.g. "<p>Hello <b>world</b>!</p>"), silently
      // changing what it renders as — so this element's inner content is
      // kept byte-for-byte instead of being pretty-printed.
      lines.push(`${pad}${renderOpenTag(node)}${node.children.map(renderVerbatim).join('')}</${node.name}>`)
    } else {
      lines.push(`${pad}${renderOpenTag(node)}`)
      lines.push(beautifyNodes(meaningful, depth + 1))
      lines.push(`${pad}</${node.name}>`)
    }
  }

  return lines.filter((l) => l !== '').join('\n')
}

export function minifyNodes(nodes: XmlNode[]): string {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'comment') continue // comments carry no meaning for a consumer — safe to drop
    if (isBlankText(node)) continue // insignificant whitespace between tags
    if (node.type === 'element' && !node.selfClosing) {
      out += `${renderOpenTag(node)}${minifyNodes(node.children)}</${node.name}>`
    } else {
      out += renderVerbatim(node)
    }
  }
  return out
}

export interface XmlFormatResult {
  output: string
  error: string | null
}

export function formatXml(input: string, mode: 'beautify' | 'minify'): XmlFormatResult {
  if (!input.trim()) return { output: '', error: null }
  const { nodes, error } = parseXml(input)
  if (error) return { output: '', error }
  return { output: mode === 'beautify' ? beautifyNodes(nodes) : minifyNodes(nodes), error: null }
}
