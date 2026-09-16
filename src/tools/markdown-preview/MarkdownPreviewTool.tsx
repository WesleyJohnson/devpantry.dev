import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { renderMarkdown } from '@/lib/markdownPreview'

const SAMPLE = `# DevPantry Markdown Preview

Paste **GitHub-flavored** Markdown on the left and see it rendered live.

## Features

- Tables, task lists, and ~~strikethrough~~
- Fenced code blocks with language hints
- [Links](https://example.com) open in a new tab automatically

## Example

| Tool | Category |
| --- | --- |
| JSON Formatter | Formatters |
| JWT Decoder | Formatters |

\`\`\`js
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

- [x] Parse Markdown accurately
- [ ] Sanitize with a second dependency (not needed — see below)

> Rendered inside a sandboxed frame with no script execution allowed at all,
> so raw HTML or a stray \`<script>\` tag in pasted Markdown can never run.
`

const PREVIEW_STYLES = `
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    padding: 1rem 1.25rem;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #27272a;
    background: #ffffff;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e4e4e7; background: #09090b; }
    a { color: #93c5fd; }
    code { background: #27272a; }
    pre { background: #18181b; border-color: #27272a; }
    blockquote { border-color: #3f3f46; color: #a1a1aa; }
    table, th, td { border-color: #3f3f46; }
    th { background: #18181b; }
  }
  h1, h2, h3, h4 { font-weight: 600; line-height: 1.3; margin: 1.2em 0 0.5em; }
  h1 { font-size: 1.6em; border-bottom: 1px solid rgba(128,128,128,0.3); padding-bottom: 0.3em; }
  h2 { font-size: 1.3em; }
  p, ul, ol, table, blockquote, pre { margin: 0.6em 0; }
  a { color: #2563eb; }
  code { font-family: ui-monospace, monospace; background: rgba(128,128,128,0.15); padding: 0.15em 0.35em; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f4f4f5; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; padding: 0.8em 1em; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid rgba(128,128,128,0.4); color: #71717a; margin-left: 0; padding-left: 1em; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid rgba(128,128,128,0.3); padding: 0.4em 0.7em; text-align: left; }
  th { background: rgba(128,128,128,0.1); }
  img { max-width: 100%; }
`

export default function MarkdownPreviewTool() {
  const [input, setInput] = useState(SAMPLE)
  const [debounced, setDebounced] = useState(SAMPLE)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(input), 200)
    return () => clearTimeout(timeout)
  }, [input])

  const { html, error } = useMemo(() => renderMarkdown(debounced), [debounced])

  const srcDoc = useMemo(
    () => `<!doctype html><html><head><meta charset="utf-8"><style>${PREVIEW_STYLES}</style></head><body>${html}</body></html>`,
    [html],
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Load sample
        </button>
        <button
          type="button"
          onClick={() => setInput('')}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-600">
          Rendered in a sandboxed frame with no script execution at all.
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Markdown
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste Markdown here..."
            className="min-h-[420px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Preview
            </span>
          </div>
          {error ? (
            <div className="flex min-h-[420px] flex-1 items-center gap-2 bg-white p-4 text-sm text-red-500 dark:bg-zinc-950">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : (
            <iframe title="Markdown preview" srcDoc={srcDoc} sandbox="" className="min-h-[420px] flex-1 bg-white dark:bg-zinc-950" />
          )}
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
