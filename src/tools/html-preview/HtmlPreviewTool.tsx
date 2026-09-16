import { useEffect, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'

const SAMPLE = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; padding: 1.5rem; color: #1f2937; }
  button { padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #d1d5db; cursor: pointer; }
</style>
</head>
<body>
  <h1>Hello, DevPantry 👋</h1>
  <p>Edit the HTML on the left — this updates live.</p>
  <button onclick="document.getElementById('out').textContent = 'Clicked at ' + new Date().toLocaleTimeString()">
    Click me
  </button>
  <p id="out"></p>
</body>
</html>`

const DEBOUNCE_MS = 250

export default function HtmlPreviewTool() {
  const [input, setInput] = useState(SAMPLE)
  const [debounced, setDebounced] = useState(SAMPLE)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(input), DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [input])

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
          Rendered in a sandboxed frame — scripts run, but can&#39;t reach this page or show popups/dialogs.
        </span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              HTML source
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste HTML here..."
            className="min-h-[420px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Preview
            </span>
          </div>
          <iframe
            title="HTML preview"
            srcDoc={debounced}
            sandbox="allow-scripts allow-forms"
            className="min-h-[420px] flex-1 bg-white dark:bg-zinc-950"
          />
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
