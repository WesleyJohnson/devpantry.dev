import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { curlToFetch, fetchToCurl, type FetchStyle } from '@/lib/curlFetch'

const CURL_SAMPLE = `curl -X POST https://api.devpantry.dev/v1/snippets \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_live_51H8x" \\
  -d '{"title":"Auth middleware","language":"typescript"}'`

const FETCH_SAMPLE = `fetch("https://api.devpantry.dev/v1/snippets", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk_live_51H8x",
  },
  body: JSON.stringify({ title: "Auth middleware", language: "typescript" }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));`

type Direction = 'curl-to-fetch' | 'fetch-to-curl'

export default function CurlToFetch() {
  const [direction, setDirection] = useState<Direction>('curl-to-fetch')
  const [curlInput, setCurlInput] = useState(CURL_SAMPLE)
  const [fetchInput, setFetchInput] = useState(FETCH_SAMPLE)
  const [fetchStyle, setFetchStyle] = useState<FetchStyle>('promise')

  const isCurlToFetch = direction === 'curl-to-fetch'
  const input = isCurlToFetch ? curlInput : fetchInput
  const setInput = isCurlToFetch ? setCurlInput : setFetchInput

  const { output, error, warnings } = useMemo(
    () => (isCurlToFetch ? curlToFetch(input, fetchStyle) : fetchToCurl(input)),
    [isCurlToFetch, input, fetchStyle],
  )
  const isValid = input.trim().length > 0 && !error

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setDirection('curl-to-fetch')}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              isCurlToFetch
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            cURL → fetch
          </button>
          <button
            type="button"
            onClick={() => setDirection('fetch-to-curl')}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              !isCurlToFetch
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            fetch → cURL
          </button>
        </div>

        {isCurlToFetch && (
          <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setFetchStyle('promise')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                fetchStyle === 'promise'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              Promise chain
            </button>
            <button
              type="button"
              onClick={() => setFetchStyle('async')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                fetchStyle === 'async'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              Async/await
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setInput(isCurlToFetch ? CURL_SAMPLE : FETCH_SAMPLE)}
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

        <div className="ml-auto">
          {input.trim() && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isValid
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              }`}
            >
              {isValid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {isValid ? 'Parsed' : "Couldn't parse"}
            </span>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isCurlToFetch ? 'cURL command' : 'fetch() call'}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={isCurlToFetch ? 'Paste a curl command here...' : 'Paste a fetch() call here...'}
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isCurlToFetch ? 'fetch() call' : 'cURL command'}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[360px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {error ? (
              <p className="font-mono text-sm text-red-500">{error}</p>
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
