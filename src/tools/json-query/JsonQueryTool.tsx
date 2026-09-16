import { useEffect, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { runQuery, type QueryLanguage } from '@/lib/jsonQuery'

const SAMPLE_DATA = JSON.stringify(
  {
    people: [
      { name: 'Ada Lovelace', age: 36, skills: ['math', 'computing'] },
      { name: 'Grace Hopper', age: 44, skills: ['navy', 'compilers'] },
      { name: 'Alan Turing', age: 41, skills: ['cryptography'] },
    ],
  },
  null,
  2,
)

const SAMPLE_EXPR: Record<QueryLanguage, string> = {
  jmespath: 'people[?age > `40`].name',
  jsonpath: '$.people[?(@.age > 40)].name',
}

const DEBOUNCE_MS = 200

export default function JsonQueryTool() {
  const [lang, setLang] = useState<QueryLanguage>('jmespath')
  const [dataInput, setDataInput] = useState(SAMPLE_DATA)
  const [expression, setExpression] = useState(SAMPLE_EXPR.jmespath)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [matchCount, setMatchCount] = useState<number | null>(null)

  useEffect(() => {
    if (!dataInput.trim() || !expression.trim()) {
      setOutput('')
      setError(null)
      setMatchCount(null)
      return
    }
    let cancelled = false
    const timeout = setTimeout(() => {
      runQuery(dataInput, expression, lang).then((result) => {
        if (cancelled) return
        setOutput(result.output)
        setError(result.error)
        setMatchCount(result.matchCount)
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [dataInput, expression, lang])

  function loadSample() {
    setDataInput(SAMPLE_DATA)
    setExpression(SAMPLE_EXPR[lang])
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['jmespath', 'jsonpath'] as const}
          value={lang}
          onChange={(next) => {
            setLang(next)
            setExpression(SAMPLE_EXPR[next])
          }}
          labels={{ jmespath: 'JMESPath', jsonpath: 'JSONPath' }}
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
            setDataInput('')
            setExpression('')
          }}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        {matchCount !== null && (
          <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
            {matchCount} match{matchCount === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {lang === 'jmespath' ? 'JMESPath expression' : 'JSONPath expression'}
          </span>
        </div>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          spellCheck={false}
          placeholder={lang === 'jmespath' ? 'people[?age > `40`].name' : '$.people[?(@.age > 40)].name'}
          className="bg-white px-4 py-3 font-mono text-sm text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
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
            placeholder="Paste JSON here..."
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Result
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
              <pre className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>

      {lang === 'jsonpath' && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          JSONPath returns an empty array both for a path that matches nothing and for a malformed expression —
          unlike JMESPath, it does not distinguish the two with a syntax error.
        </p>
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
