import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { backslashEscape, backslashUnescape } from '@/lib/backslashEscape'

const SAMPLE_TEXT = 'Line one\nLine two\tTabbed "quoted" and a \\backslash'
const SAMPLE_ESCAPED = backslashEscape(SAMPLE_TEXT)

type Mode = 'escape' | 'unescape'

export default function BackslashEscapeTool() {
  const [mode, setMode] = useState<Mode>('escape')
  const [escapeInput, setEscapeInput] = useState(SAMPLE_TEXT)
  const [unescapeInput, setUnescapeInput] = useState(SAMPLE_ESCAPED)

  const isEscape = mode === 'escape'
  const input = isEscape ? escapeInput : unescapeInput
  const setInput = isEscape ? setEscapeInput : setUnescapeInput

  const { output, error } = useMemo(() => {
    if (isEscape) return { output: backslashEscape(escapeInput), error: null }
    return backslashUnescape(unescapeInput)
  }, [isEscape, escapeInput, unescapeInput])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['escape', 'unescape'] as const}
          value={mode}
          onChange={setMode}
          labels={{ escape: 'Escape', unescape: 'Unescape' }}
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(isEscape ? SAMPLE_TEXT : SAMPLE_ESCAPED)}
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
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        Follows JSON/JS string escape conventions (\n \t \\ \" etc.) — the same rules used inside a
        double-quoted string literal.
      </p>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isEscape ? 'Raw text' : 'Escaped'}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={isEscape ? 'Type or paste text here...' : 'Paste escaped text here...'}
            className="min-h-[300px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isEscape ? 'Escaped' : 'Raw text'}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[300px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {error ? (
              <p className="font-mono text-sm text-red-500">{error}</p>
            ) : (
              <pre className="font-mono text-sm leading-relaxed break-all whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
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
