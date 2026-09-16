import { html_beautify } from 'js-beautify/js/lib/beautify-html.js'
import { formatCss } from '@/lib/cssFormatter'
import { minifyJs } from '@/lib/jsFormatter'

export interface HtmlFormatResult {
  output: string
  error: string | null
}

// js-beautify's HTML beautifier is fully lenient — confirmed it never throws
// even on malformed markup (unclosed tags, plain non-HTML text), it just
// does its best, matching how a real browser parses HTML. No error path
// needed here the way the XML formatter needs one.
export function beautifyHtml(input: string): HtmlFormatResult {
  if (!input.trim()) return { output: '', error: null }
  return { output: html_beautify(input, { indent_size: 2, wrap_line_length: 0 }), error: null }
}

// No vetted browser-safe HTML minifier exists: html-minifier-terser pulls in
// clean-css, whose core "read sources" pipeline unconditionally requires
// Node's fs/path/url/http modules (confirmed by trying to bundle it — it
// fails outright, not just a phone-home risk). Rather than accept an
// unvetted dependency or write a full HTML5 parser, this is a single-pass
// scanner that does the high-value, safe subset of minification: strip
// comments, collapse whitespace runs (never delete them outright — that can
// change how inline content lays out), and hand off actual <script>/<style>
// bodies to the JS/CSS minifiers this app already vetted and ships
// separately (Terser, and the hand-rolled Tier 2 CSS formatter).
const RAW_TEXT_TAGS = new Set(['script', 'style'])
const PRESERVE_WHITESPACE_TAGS = new Set(['pre', 'textarea'])
const NON_JS_SCRIPT_TYPE_RE = /type\s*=\s*["']?([^"'\s>]+)/i
const SRC_ATTR_RE = /\ssrc\s*=/i

function findTagEnd(input: string, start: number): number {
  let i = start + 1
  let quote: string | null = null
  while (i < input.length) {
    const ch = input[i]
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '>') {
      return i
    }
    i++
  }
  return input.length - 1
}

function isInlineJsScript(openTag: string): boolean {
  if (SRC_ATTR_RE.test(openTag)) return false
  const typeMatch = NON_JS_SCRIPT_TYPE_RE.exec(openTag)
  const type = typeMatch?.[1]?.toLowerCase()
  return !type || type === 'text/javascript' || type === 'module' || type === 'application/javascript'
}

export async function minifyHtml(input: string): Promise<HtmlFormatResult> {
  if (!input.trim()) return { output: '', error: null }

  const n = input.length
  let i = 0
  let out = ''

  while (i < n) {
    if (input.startsWith('<!--', i)) {
      const end = input.indexOf('-->', i + 4)
      i = end === -1 ? n : end + 3
      continue
    }

    if (input[i] === '<') {
      if (input.startsWith('<!', i)) {
        const end = input.indexOf('>', i)
        const stop = end === -1 ? n : end + 1
        out += input.slice(i, stop)
        i = stop
        continue
      }

      const tagMatch = /^<\/?([a-zA-Z][a-zA-Z0-9-]*)/.exec(input.slice(i))
      if (!tagMatch) {
        out += '<'
        i++
        continue
      }

      const isClosing = input[i + 1] === '/'
      const tagName = tagMatch[1].toLowerCase()
      const tagEnd = findTagEnd(input, i)
      const rawTag = input.slice(i, tagEnd + 1)
      out += rawTag
      i = tagEnd + 1

      if (!isClosing && (RAW_TEXT_TAGS.has(tagName) || PRESERVE_WHITESPACE_TAGS.has(tagName))) {
        const closeRe = new RegExp(`</${tagName}\\s*>`, 'i')
        const match = closeRe.exec(input.slice(i))
        const contentEnd = match ? i + match.index : n
        const content = input.slice(i, contentEnd)

        if (PRESERVE_WHITESPACE_TAGS.has(tagName) || !content.trim()) {
          out += content
        } else if (tagName === 'script') {
          if (isInlineJsScript(rawTag)) {
            const result = await minifyJs(content)
            out += result.error ? content : result.output
          } else {
            out += content
          }
        } else {
          const result = formatCss(content, 'minify')
          out += result.error ? content : result.output
        }

        if (match) {
          out += input.slice(contentEnd, contentEnd + match[0].length)
          i = contentEnd + match[0].length
        } else {
          i = n
        }
      }
      continue
    }

    const start = i
    while (i < n && input[i] !== '<') i++
    out += input.slice(start, i).replace(/\s+/g, ' ')
  }

  return { output: out, error: null }
}
