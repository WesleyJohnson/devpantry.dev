import { useMemo, useState } from 'react'
import { AlertTriangle, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { csvToJson, jsonToCsv } from '@/lib/csvJson'

const SAMPLE_CSV = `name,role,years
Ada Lovelace,Mathematician,2
Grace Hopper,"Rear Admiral, USN",44
"Turing, Alan",Cryptanalyst,14`

const SAMPLE_JSON = JSON.stringify(
  [
    { name: 'Ada Lovelace', role: 'Mathematician', years: 2 },
    { name: 'Grace Hopper', role: 'Rear Admiral, USN', years: 44 },
  ],
  null,
  2,
)

type Direction = 'csv-to-json' | 'json-to-csv'
type Delimiter = ',' | ';' | '\t'

const DELIMITER_LABELS: Record<Delimiter, string> = { ',': 'Comma', ';': 'Semicolon', '\t': 'Tab' }

export default function CsvJsonTool() {
  const [direction, setDirection] = useState<Direction>('csv-to-json')
  const [csvInput, setCsvInput] = useState(SAMPLE_CSV)
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON)
  const [delimiter, setDelimiter] = useState<Delimiter>(',')
  const [hasHeader, setHasHeader] = useState(true)

  const isCsvToJson = direction === 'csv-to-json'

  const csvResult = useMemo(() => csvToJson(csvInput, delimiter, hasHeader), [csvInput, delimiter, hasHeader])
  const jsonResult = useMemo(() => jsonToCsv(jsonInput, delimiter), [jsonInput, delimiter])

  const output = isCsvToJson ? csvResult.json : jsonResult.csv
  const error = isCsvToJson ? csvResult.error : jsonResult.error
  const warnings = isCsvToJson ? csvResult.warnings : jsonResult.warnings

  function loadSample() {
    setCsvInput(SAMPLE_CSV)
    setJsonInput(SAMPLE_JSON)
  }

  function reset() {
    setCsvInput('')
    setJsonInput('')
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['csv-to-json', 'json-to-csv'] as const}
          value={direction}
          onChange={setDirection}
          labels={{ 'csv-to-json': 'CSV → JSON', 'json-to-csv': 'JSON → CSV' }}
        />

        <SegmentedControl
          options={[',', ';', '\t'] as const}
          value={delimiter}
          onChange={setDelimiter}
          labels={DELIMITER_LABELS}
        />

        {isCsvToJson && (
          <label className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
            First row is header
          </label>
        )}

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
          onClick={reset}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
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
              {isCsvToJson ? 'CSV' : 'JSON'}
            </span>
          </div>
          <textarea
            value={isCsvToJson ? csvInput : jsonInput}
            onChange={(e) => (isCsvToJson ? setCsvInput(e.target.value) : setJsonInput(e.target.value))}
            spellCheck={false}
            placeholder={isCsvToJson ? 'Paste CSV here...' : 'Paste a JSON array here...'}
            className="min-h-[320px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isCsvToJson ? 'JSON' : 'CSV'}
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
              <pre className="font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{output}</pre>
            )}
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
