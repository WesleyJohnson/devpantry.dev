import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { countLines, processLines, type SortMode } from '@/lib/lineTools'

const SAMPLE = `banana
apple
Apple
cherry
banana
item10
item2
item1`

export default function LineTools() {
  const [input, setInput] = useState(SAMPLE)
  const [sortMode, setSortMode] = useState<SortMode>('asc')
  const [caseInsensitive, setCaseInsensitive] = useState(false)
  const [naturalSort, setNaturalSort] = useState(false)
  const [dedupe, setDedupe] = useState(true)
  const [trimLines, setTrimLines] = useState(true)
  const [removeEmpty, setRemoveEmpty] = useState(true)

  const output = useMemo(
    () => processLines(input, { sortMode, caseInsensitive, naturalSort, dedupe, trimLines, removeEmpty }),
    [input, sortMode, caseInsensitive, naturalSort, dedupe, trimLines, removeEmpty],
  )

  const inputCount = countLines(input)
  const outputCount = countLines(output)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SegmentedControl
          options={['none', 'asc', 'desc'] as const}
          value={sortMode}
          onChange={setSortMode}
          labels={{ none: 'No sort', asc: 'A → Z', desc: 'Z → A' }}
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={dedupe}
              onChange={(e) => setDedupe(e.target.checked)}
              className="accent-emerald-500"
            />
            Remove duplicates
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={caseInsensitive}
              onChange={(e) => setCaseInsensitive(e.target.checked)}
              className="accent-emerald-500"
            />
            Case-insensitive
          </label>
          <label
            className={`flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 ${
              sortMode === 'none' ? 'opacity-50' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={naturalSort}
              disabled={sortMode === 'none'}
              onChange={(e) => setNaturalSort(e.target.checked)}
              className="accent-emerald-500"
            />
            Natural sort (item2 before item10)
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={trimLines}
              onChange={(e) => setTrimLines(e.target.checked)}
              className="accent-emerald-500"
            />
            Trim whitespace
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={(e) => setRemoveEmpty(e.target.checked)}
              className="accent-emerald-500"
            />
            Remove empty lines
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {input && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {inputCount} → {outputCount} lines
            </span>
          )}
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
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Input
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste lines here..."
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Output
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[360px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            <pre className="font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{output}</pre>
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
