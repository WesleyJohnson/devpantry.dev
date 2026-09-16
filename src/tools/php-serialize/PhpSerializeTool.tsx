import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { jsonToPhpSerialize, phpUnserializeToJson } from '@/lib/phpSerialize'

const SAMPLE_JSON = JSON.stringify(
  { name: 'Ada Lovelace', tags: ['math', 'computing'], active: true, score: 9.5 },
  null,
  2,
)
const SAMPLE_PHP = 'a:4:{s:4:"name";s:12:"Ada Lovelace";s:4:"tags";a:2:{i:0;s:4:"math";i:1;s:9:"computing";}s:6:"active";b:1;s:5:"score";d:9.5;}'

type Direction = 'json-to-php' | 'php-to-json'

export default function PhpSerializeTool() {
  const [direction, setDirection] = useState<Direction>('json-to-php')
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON)
  const [phpInput, setPhpInput] = useState(SAMPLE_PHP)

  const isJsonToPhp = direction === 'json-to-php'

  const { output, error } = useMemo(
    () => (isJsonToPhp ? jsonToPhpSerialize(jsonInput) : phpUnserializeToJson(phpInput)),
    [isJsonToPhp, jsonInput, phpInput],
  )

  function loadSample() {
    setJsonInput(SAMPLE_JSON)
    setPhpInput(SAMPLE_PHP)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['json-to-php', 'php-to-json'] as const}
          value={direction}
          onChange={setDirection}
          labels={{ 'json-to-php': 'JSON → PHP', 'php-to-json': 'PHP → JSON' }}
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
        A JSON object with a <code className="font-mono">__phpClass</code> string key round-trips as a PHP object of
        that class; every other JSON object becomes a PHP associative array.
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isJsonToPhp ? 'JSON' : 'PHP serialized'}
            </span>
          </div>
          <textarea
            value={isJsonToPhp ? jsonInput : phpInput}
            onChange={(e) => (isJsonToPhp ? setJsonInput(e.target.value) : setPhpInput(e.target.value))}
            spellCheck={false}
            placeholder={isJsonToPhp ? 'Paste JSON here...' : 'Paste a PHP serialize() string here...'}
            className="min-h-[320px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isJsonToPhp ? 'PHP serialized' : 'JSON'}
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
