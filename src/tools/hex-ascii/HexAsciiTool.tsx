import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { hexToText, textToHex } from '@/lib/hexAscii'

const SAMPLE_TEXT = 'Hello, DevPantry! 🚀'
const SAMPLE_HEX = textToHex(SAMPLE_TEXT)

type Mode = 'toHex' | 'toText'

export default function HexAsciiTool() {
  const [mode, setMode] = useState<Mode>('toHex')
  const [textInput, setTextInput] = useState(SAMPLE_TEXT)
  const [hexInput, setHexInput] = useState(SAMPLE_HEX)

  const isToHex = mode === 'toHex'
  const input = isToHex ? textInput : hexInput
  const setInput = isToHex ? setTextInput : setHexInput

  const { output, error } = useMemo(() => {
    if (isToHex) return { output: textToHex(textInput), error: null }
    return hexToText(hexInput)
  }, [isToHex, textInput, hexInput])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['toHex', 'toText'] as const}
          value={mode}
          onChange={setMode}
          labels={{ toHex: 'Text → Hex', toText: 'Hex → Text' }}
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(isToHex ? SAMPLE_TEXT : SAMPLE_HEX)}
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

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isToHex ? 'Text' : 'Hex'}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={isToHex ? 'Type or paste text here...' : 'Paste hex bytes here (48 65 6c 6c 6f)...'}
            className="min-h-[300px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isToHex ? 'Hex' : 'Text'}
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
