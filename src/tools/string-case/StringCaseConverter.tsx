import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import {
  toCamelCase,
  toConstantCase,
  toDotCase,
  toKebabCase,
  toLowerCaseWords,
  toPascalCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toUpperCaseWords,
} from '@/lib/stringCase'

const SAMPLE = 'devpantry API request handler'

const CASES: { label: string; convert: (s: string) => string }[] = [
  { label: 'camelCase', convert: (s) => toCamelCase(s) },
  { label: 'PascalCase', convert: (s) => toPascalCase(s) },
  { label: 'snake_case', convert: toSnakeCase },
  { label: 'kebab-case', convert: toKebabCase },
  { label: 'CONSTANT_CASE', convert: toConstantCase },
  { label: 'dot.case', convert: toDotCase },
  { label: 'Title Case', convert: toTitleCase },
  { label: 'Sentence case', convert: toSentenceCase },
  { label: 'lower case', convert: toLowerCaseWords },
  { label: 'UPPER CASE', convert: toUpperCaseWords },
]

export default function StringCaseConverter() {
  const [input, setInput] = useState(SAMPLE)

  const results = useMemo(() => CASES.map((c) => ({ label: c.label, value: c.convert(input) })), [input])

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
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Input
          </span>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Type or paste any text, identifier, or phrase..."
          className="bg-white px-4 py-3 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {results.map((r) => (
          <div
            key={r.label}
            className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {r.label}
              </span>
              <CopyButton value={r.value} />
            </div>
            <div className="min-h-[44px] break-all bg-white px-3 py-2.5 font-mono text-sm text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              {r.value || <span className="text-zinc-400 dark:text-zinc-600">—</span>}
            </div>
          </div>
        ))}
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
