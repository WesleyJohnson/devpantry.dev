import { useMemo, useState } from 'react'
import { AlertTriangle, RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { htmlEntityDecode, htmlEntityEncode } from '@/lib/htmlEntity'

const SAMPLE_TEXT = '<div class="greeting">café & "friends" — 2026</div>'
const SAMPLE_ENCODED = htmlEntityEncode(SAMPLE_TEXT, false)

type Mode = 'encode' | 'decode'

export default function HtmlEntityTool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [encodeInput, setEncodeInput] = useState(SAMPLE_TEXT)
  const [decodeInput, setDecodeInput] = useState(SAMPLE_ENCODED)
  const [encodeNonAscii, setEncodeNonAscii] = useState(false)

  const isEncode = mode === 'encode'
  const input = isEncode ? encodeInput : decodeInput
  const setInput = isEncode ? setEncodeInput : setDecodeInput

  const { output, warnings } = useMemo(() => {
    if (isEncode) return { output: htmlEntityEncode(encodeInput, encodeNonAscii), warnings: [] as string[] }
    return htmlEntityDecode(decodeInput)
  }, [isEncode, encodeInput, decodeInput, encodeNonAscii])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['encode', 'decode'] as const}
          value={mode}
          onChange={setMode}
          labels={{ encode: 'Encode', decode: 'Decode' }}
        />

        {isEncode && (
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={encodeNonAscii}
              onChange={(e) => setEncodeNonAscii(e.target.checked)}
              className="accent-emerald-500"
            />
            Also encode non-ASCII characters
          </label>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(isEncode ? SAMPLE_TEXT : SAMPLE_ENCODED)}
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

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isEncode ? 'Text' : 'HTML entities'}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={isEncode ? 'Type or paste text here...' : 'Paste HTML-entity-encoded text here...'}
            className="min-h-[300px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isEncode ? 'HTML entities' : 'Text'}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[300px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            <pre className="font-mono text-sm leading-relaxed break-all whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
              {output}
            </pre>
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
