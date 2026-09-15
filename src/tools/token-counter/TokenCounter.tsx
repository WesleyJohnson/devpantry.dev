import { useEffect, useMemo, useState } from 'react'
import { Loader2, RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import {
  TOKENIZERS,
  countCharsAndWords,
  countExactTokens,
  estimateApproxTokens,
  type ExactEncodingId,
} from '@/lib/tokenCounter'

const SAMPLE = `You are a helpful assistant. Summarize the following support ticket in two sentences, then suggest the next action for the on-call engineer.

Ticket: Customers report intermittent 502s from the checkout API during peak traffic. It started roughly 40 minutes after last night's deploy, and the error rate is around 3% and climbing slowly.`

export default function TokenCounter() {
  const [input, setInput] = useState(SAMPLE)
  const [exactCounts, setExactCounts] = useState<Partial<Record<ExactEncodingId, number>>>({})
  const [loading, setLoading] = useState(false)

  const { chars, words } = useMemo(() => countCharsAndWords(input), [input])
  const approxTokens = useMemo(() => estimateApproxTokens(input), [input])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([countExactTokens('o200k_base', input), countExactTokens('cl100k_base', input)]).then(
      ([o200k, cl100k]) => {
        if (!cancelled) {
          setExactCounts({ o200k_base: o200k, cl100k_base: cl100k })
          setLoading(false)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [input])

  const summary = useMemo(() => {
    const lines = [`Characters: ${chars}`, `Words: ${words}`, '']
    for (const row of TOKENIZERS) {
      if (row.kind === 'exact' && row.encoding) {
        lines.push(`${row.label}: ${exactCounts[row.encoding] ?? 0} tokens (exact)`)
      } else {
        lines.push(`${row.label}: ~${approxTokens} tokens (approximate)`)
      }
    }
    return lines.join('\n')
  }, [chars, words, exactCounts, approxTokens])

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

        <div className="ml-auto flex items-center gap-2">
          {input && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {chars} chars · {words} words
            </span>
          )}
          {loading && (
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading tokenizer
            </span>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Text
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste a prompt or document here..."
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Token counts
            </span>
            <CopyButton value={summary} />
          </div>
          <div className="min-h-[360px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {TOKENIZERS.map((row) => {
                const count = row.kind === 'exact' && row.encoding ? exactCounts[row.encoding] : approxTokens
                return (
                  <div key={row.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{row.label}</span>
                      <span
                        className={`text-[11px] font-medium uppercase tracking-wide ${
                          row.kind === 'exact'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {row.kind === 'exact' ? 'Exact' : 'Approximate'}
                      </span>
                    </div>
                    <span className="font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {row.kind === 'approx' ? '~' : ''}
                      {count ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
              Claude and Gemini don't publish a downloadable tokenizer, so that row is a ~4-characters-per-token
              estimate rather than an exact count.
            </p>
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
