import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { jsonToPhp, phpToJson } from '@/lib/phpJson'

const SAMPLE_JSON = JSON.stringify(
  { name: 'Ada Lovelace', tags: ['math', 'computing'], active: true, meta: null },
  null,
  2,
)
const SAMPLE_PHP = `[
    'name' => 'Ada Lovelace',
    'tags' => ['math', 'computing'],
    'active' => true,
    'meta' => null,
]`

type Direction = 'json-to-php' | 'php-to-json'

export default function PhpJsonTool() {
  const [direction, setDirection] = useState<Direction>('php-to-json')
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON)
  const [phpInput, setPhpInput] = useState(SAMPLE_PHP)

  const isPhpToJson = direction === 'php-to-json'

  const { output, error } = useMemo(
    () => (isPhpToJson ? phpToJson(phpInput) : jsonToPhp(jsonInput)),
    [isPhpToJson, phpInput, jsonInput],
  )

  function loadSample() {
    setJsonInput(SAMPLE_JSON)
    setPhpInput(SAMPLE_PHP)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['php-to-json', 'json-to-php'] as const}
          value={direction}
          onChange={setDirection}
          labels={{ 'php-to-json': 'PHP → JSON', 'json-to-php': 'JSON → PHP' }}
        />

        <button
          type="button"
          onClick={loadSample}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Load sample
        </button>
        <button
          type="button"
          onClick={() => {
            setJsonInput('')
            setPhpInput('')
          }}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        Scoped to literal PHP values only — arrays (both <code className="font-mono">[...]</code> and{' '}
        <code className="font-mono">array(...)</code>), strings, numbers, booleans, and null. Variables, function
        calls, and string interpolation cannot be evaluated statically.
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isPhpToJson ? 'PHP' : 'JSON'}
            </span>
          </div>
          <textarea
            value={isPhpToJson ? phpInput : jsonInput}
            onChange={(e) => (isPhpToJson ? setPhpInput(e.target.value) : setJsonInput(e.target.value))}
            spellCheck={false}
            placeholder={isPhpToJson ? "Paste a PHP array literal here, e.g. ['a' => 1]..." : 'Paste JSON here...'}
            className="min-h-[320px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isPhpToJson ? 'JSON' : 'PHP'}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[320px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {error ? (
              <p className="flex items-center gap-2 font-mono text-sm text-red-500">
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
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
