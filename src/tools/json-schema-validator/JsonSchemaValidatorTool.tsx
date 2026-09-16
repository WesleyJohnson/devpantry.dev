import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { validateAgainstSchema, type ValidationError } from '@/lib/jsonSchemaValidator'

const SAMPLE_SCHEMA = JSON.stringify(
  {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      age: { type: 'integer', minimum: 0 },
      email: { type: 'string', format: 'email' },
      tags: { type: 'array', items: { type: 'string' }, minItems: 1 },
    },
    required: ['name', 'email'],
    additionalProperties: false,
  },
  null,
  2,
)

const SAMPLE_DATA = JSON.stringify(
  {
    name: 'Ada Lovelace',
    age: -1,
    email: 'not-an-email',
    extra: true,
  },
  null,
  2,
)

const DEBOUNCE_MS = 250

export default function JsonSchemaValidatorTool() {
  const [schemaInput, setSchemaInput] = useState(SAMPLE_SCHEMA)
  const [dataInput, setDataInput] = useState(SAMPLE_DATA)
  const [valid, setValid] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!schemaInput.trim() || !dataInput.trim()) {
      setValid(null)
      setErrors([])
      setError(null)
      setIsPending(false)
      return
    }
    setIsPending(true)
    let cancelled = false
    const timeout = setTimeout(() => {
      validateAgainstSchema(schemaInput, dataInput).then((result) => {
        if (cancelled) return
        setValid(result.valid)
        setErrors(result.errors)
        setError(result.error)
        setIsPending(false)
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [schemaInput, dataInput])

  function loadSample() {
    setSchemaInput(SAMPLE_SCHEMA)
    setDataInput(SAMPLE_DATA)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
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
            setSchemaInput('')
            setDataInput('')
          }}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <div className="ml-auto">
          {valid !== null && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                valid
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              }`}
            >
              {valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {valid ? 'Valid' : 'Invalid'}
              {isPending && <span className="text-zinc-400 dark:text-zinc-600"> (updating...)</span>}
            </span>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              JSON Schema
            </span>
          </div>
          <textarea
            value={schemaInput}
            onChange={(e) => setSchemaInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste a JSON Schema here..."
            className="min-h-[320px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              JSON data
            </span>
          </div>
          <textarea
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste the JSON instance to validate..."
            className="min-h-[320px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : errors.length > 0 ? (
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Validation errors ({errors.length})
            </span>
          </div>
          <ul className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {errors.map((e, i) => (
              <li key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <div>
                  <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{e.instancePath}</span>{' '}
                  <span className="text-zinc-600 dark:text-zinc-400">{e.message}</span>
                  <span className="ml-1.5 text-zinc-400 dark:text-zinc-600">({e.keyword})</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : valid === true ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Data matches the schema.
        </div>
      ) : null}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
