import { useMemo, useState } from 'react'
import { AlertTriangle, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { jsonToYaml, yamlToJson } from '@/lib/yamlJson'

const SAMPLE_YAML = `name: Ada Lovelace
role: Mathematician
tags:
  - math
  - computing
active: true
address:
  city: London
  country: UK`

const SAMPLE_JSON = JSON.stringify(
  {
    name: 'Ada Lovelace',
    role: 'Mathematician',
    tags: ['math', 'computing'],
    active: true,
    address: { city: 'London', country: 'UK' },
  },
  null,
  2,
)

type Direction = 'yaml-to-json' | 'json-to-yaml'

export default function YamlJsonTool() {
  const [direction, setDirection] = useState<Direction>('yaml-to-json')
  const [yamlInput, setYamlInput] = useState(SAMPLE_YAML)
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON)

  const isYamlToJson = direction === 'yaml-to-json'

  const { output, error, warning } = useMemo(
    () => (isYamlToJson ? yamlToJson(yamlInput) : jsonToYaml(jsonInput)),
    [isYamlToJson, yamlInput, jsonInput],
  )

  function loadSample() {
    setYamlInput(SAMPLE_YAML)
    setJsonInput(SAMPLE_JSON)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['yaml-to-json', 'json-to-yaml'] as const}
          value={direction}
          onChange={setDirection}
          labels={{ 'yaml-to-json': 'YAML → JSON', 'json-to-yaml': 'JSON → YAML' }}
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
            setYamlInput('')
            setJsonInput('')
          }}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {warning && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {warning}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isYamlToJson ? 'YAML' : 'JSON'}
            </span>
          </div>
          <textarea
            value={isYamlToJson ? yamlInput : jsonInput}
            onChange={(e) => (isYamlToJson ? setYamlInput(e.target.value) : setJsonInput(e.target.value))}
            spellCheck={false}
            placeholder={isYamlToJson ? 'Paste YAML here...' : 'Paste JSON here...'}
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isYamlToJson ? 'JSON' : 'YAML'}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[360px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {error ? (
              <p className="flex items-center gap-2 whitespace-pre-wrap font-mono text-sm text-red-500">
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
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
