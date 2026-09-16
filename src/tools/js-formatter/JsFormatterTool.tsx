import { useEffect, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { beautifyJs, minifyJs } from '@/lib/jsFormatter'

const SAMPLE = `function greet(name, greeting = "Hello") {
  const message = greeting + ", " + name + "!";
  console.log(message);
  return message;
}

const users = [{ name: "Ada", active: true }, { name: "Grace", active: false }];
const activeNames = users.filter((u) => u.active).map((u) => u.name);
greet(activeNames[0]);`

type Mode = 'beautify' | 'minify'

const DEBOUNCE_MS = 300

export default function JsFormatterTool() {
  const [input, setInput] = useState(SAMPLE)
  const [mode, setMode] = useState<Mode>('beautify')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setIsPending(false)
      return
    }
    setIsPending(true)
    let cancelled = false
    const timeout = setTimeout(() => {
      const run = mode === 'beautify' ? beautifyJs : minifyJs
      run(input).then((result) => {
        if (cancelled) return
        setOutput(result.output)
        setError(result.error)
        setIsPending(false)
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [input, mode])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['beautify', 'minify'] as const}
          value={mode}
          onChange={setMode}
          labels={{ beautify: 'Beautify', minify: 'Minify' }}
        />

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
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              JavaScript input
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste JavaScript here..."
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {mode === 'beautify' ? 'Beautified' : 'Minified'}
              {isPending && <span className="ml-1 text-zinc-400 dark:text-zinc-600">(working...)</span>}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[360px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {error ? (
              <pre className="whitespace-pre-wrap font-mono text-sm text-red-500">
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  Error
                </span>
                {'\n'}
                {error}
              </pre>
            ) : (
              <pre className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
