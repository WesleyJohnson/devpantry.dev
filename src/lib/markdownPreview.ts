import { Marked, type RendererObject } from 'marked'

// marked passes raw HTML in the source straight through unsanitized (its own
// docs recommend pairing it with a sanitizer like DOMPurify for untrusted
// input) — rather than pull in a second dependency for that, the rendered
// HTML gets dropped into a sandboxed <iframe srcdoc> with no "allow-scripts"
// at all, same defense used for the HTML Preview tool. A sandboxed frame
// without that flag cannot execute embedded <script> tags or inline event
// handlers no matter what slips through, so no sanitizer is needed.
const renderer: RendererObject = {
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens)
    const titleAttr = title ? ` title="${title}"` : ''
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`
  },
}

const markedInstance = new Marked({ renderer, gfm: true, breaks: false })

export interface MarkdownRenderResult {
  html: string
  error: string | null
}

export function renderMarkdown(input: string): MarkdownRenderResult {
  if (!input.trim()) return { html: '', error: null }
  try {
    const html = markedInstance.parse(input, { async: false })
    return { html: typeof html === 'string' ? html : '', error: null }
  } catch (e) {
    return { html: '', error: e instanceof Error ? e.message : "Couldn't render markdown" }
  }
}
