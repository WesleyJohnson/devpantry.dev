import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { describeCron, nextRuns, parseCron } from '@/lib/cronParser'

const SAMPLE = '0 9 * * 1-5'
const MAX_COUNT = 25
const DEBOUNCE_MS = 200

function formatRun(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CronParserTool() {
  const [pattern, setPattern] = useState(SAMPLE)
  const [count, setCount] = useState(5)
  const [debouncedPattern, setDebouncedPattern] = useState(pattern)
  const [debouncedCount, setDebouncedCount] = useState(count)

  // Parsing + the English description are cheap (no loops over time), so
  // they stay instant. Only the next-runs search — which can burn a real
  // iteration budget on a rare or impossible schedule — is debounced, so
  // typing doesn't repeatedly trigger the expensive path mid-keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedPattern(pattern)
      setDebouncedCount(count)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [pattern, count])

  const { parsed, error, isReboot } = useMemo(() => parseCron(pattern), [pattern])
  const description = useMemo(() => (parsed ? describeCron(parsed) : ''), [parsed])

  const debouncedResult = useMemo(() => parseCron(debouncedPattern), [debouncedPattern])
  const { runs, truncatedSearch } = useMemo(() => {
    if (!debouncedResult.parsed) return { runs: [], truncatedSearch: false }
    return nextRuns(debouncedResult.parsed, debouncedCount)
  }, [debouncedResult.parsed, debouncedCount])

  const isPending = debouncedPattern !== pattern || debouncedCount !== count
  const isValid = pattern.trim().length > 0 && !error && !isReboot

  const copySummary = useMemo(() => {
    if (!description) return ''
    const lines = [description, '', 'Upcoming runs (local time):']
    for (const run of runs) lines.push(`  ${formatRun(run)}`)
    return lines.join('\n')
  }, [description, runs])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Show next</span>
          <input
            type="number"
            min={1}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => setCount(Math.min(MAX_COUNT, Math.max(1, Number(e.target.value) || 1)))}
            className="w-16 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">runs (max {MAX_COUNT})</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pattern.trim() && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isValid
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : isReboot
                    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              }`}
            >
              {isReboot ? (
                'Special: @reboot'
              ) : isValid ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valid
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Invalid
                </>
              )}
            </span>
          )}
          <button
            type="button"
            onClick={() => setPattern(SAMPLE)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <WandSparkles className="h-3.5 w-3.5" />
            Load sample
          </button>
          <button
            type="button"
            onClick={() => setPattern('')}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Cron expression
          </span>
        </div>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          spellCheck={false}
          placeholder="minute hour day-of-month month day-of-week"
          className="bg-white px-4 py-3 font-mono text-sm text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      {isReboot ? (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          @reboot runs once when the system starts — it has no fixed schedule to compute upcoming runs for.
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : (
        parsed && (
          <>
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Description
                </span>
                <CopyButton value={copySummary} />
              </div>
              <div className="bg-white p-4 text-sm text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {description}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Next {count} run{count === 1 ? '' : 's'} (your local time)
                  {isPending && <span className="ml-1 text-zinc-400 dark:text-zinc-600">(updating...)</span>}
                </span>
              </div>
              {runs.length === 0 ? (
                <p className="p-4 text-sm text-zinc-400 dark:text-zinc-600">
                  No matching time found in the next 8 years — this schedule may be impossible (e.g. day-of-month 31
                  in a month that never has 31 days).
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {runs.map((run, i) => (
                    <li key={i} className="px-3 py-2 font-mono text-sm text-zinc-800 dark:text-zinc-200">
                      {formatRun(run)}
                    </li>
                  ))}
                </ul>
              )}
              {truncatedSearch && runs.length > 0 && (
                <p className="border-t border-zinc-100 px-3 py-2 text-xs text-amber-600 dark:border-zinc-800 dark:text-amber-400">
                  Only found {runs.length} of {count} requested — no more matches within the next 8 years searched.
                </p>
              )}
            </div>
          </>
        )
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
