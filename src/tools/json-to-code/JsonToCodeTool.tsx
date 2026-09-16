import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { jsonToCode, type Lang } from '@/lib/jsonToCode'

const SAMPLE = JSON.stringify(
  [
    { id: 1, name: 'Ada Lovelace', tags: ['math', 'computing'], nickname: 'Countess' },
    { id: 2, name: 'Grace Hopper', tags: ['navy', 'compilers'] },
  ],
  null,
  2,
)

const LANG_LABELS: Record<Lang, string> = { typescript: 'TypeScript', python: 'Python', go: 'Go' }

export default function JsonToCodeTool() {
  const [input, setInput] = useState(SAMPLE)
  const [lang, setLang] = useState<Lang>('typescript')
  const [rootName, setRootName] = useState('Root')

  const { output, error } = useMemo(() => jsonToCode(input, lang, rootName || 'Root'), [input, lang, rootName])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl options={['typescript', 'python', 'go'] as const} value={lang} onChange={setLang} labels={LANG_LABELS} />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Root name</span>
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="Root"
            className="w-28 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

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
              JSON sample
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste a JSON sample here..."
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {LANG_LABELS[lang]}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[360px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {error ? (
              <p className="flex items-center gap-2 font-mono text-sm text-red-500">
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : (
              <pre className="font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{output}</pre>
            )}
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
