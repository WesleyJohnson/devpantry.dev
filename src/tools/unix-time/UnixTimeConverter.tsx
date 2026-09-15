import { useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import {
  formatIso,
  formatRelative,
  formatTimestamp,
  fromDatetimeLocalValue,
  parseIso,
  parseTimestamp,
  toDatetimeLocalValue,
  type TimeUnit,
} from '@/lib/unixTime'

const SAMPLE_MS = Date.UTC(2026, 0, 1, 0, 0, 0) // 2026-01-01T00:00:00Z

type FieldKey = 'timestamp' | 'iso'

export default function UnixTimeConverter() {
  const [ms, setMs] = useState<number>(SAMPLE_MS)
  const [unit, setUnit] = useState<TimeUnit>('seconds')
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null)
  const [draftText, setDraftText] = useState('')
  const [invalidField, setInvalidField] = useState<FieldKey | null>(null)

  function formatField(key: FieldKey): string {
    return key === 'timestamp' ? formatTimestamp(ms, unit) : formatIso(ms)
  }

  function parseField(key: FieldKey, text: string): number | null {
    return key === 'timestamp' ? parseTimestamp(text, unit) : parseIso(text)
  }

  function fieldValue(key: FieldKey): string {
    return focusedField === key ? draftText : formatField(key)
  }

  function handleFocus(key: FieldKey) {
    setFocusedField(key)
    setDraftText(formatField(key))
    setInvalidField(null)
  }

  function handleChange(key: FieldKey, text: string) {
    setDraftText(text)
    const parsed = parseField(key, text)
    if (parsed !== null) {
      setMs(parsed)
      setInvalidField(null)
    } else {
      setInvalidField(key)
    }
  }

  function handleBlur() {
    setFocusedField(null)
    setDraftText('')
    setInvalidField(null)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['seconds', 'milliseconds'] as const}
          value={unit}
          onChange={setUnit}
          labels={{ seconds: 'Seconds', milliseconds: 'Milliseconds' }}
        />

        <button
          type="button"
          onClick={() => setMs(Date.now())}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Now
        </button>

        <div className="ml-auto flex items-center gap-2">
          {invalidField && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
              Invalid {invalidField === 'timestamp' ? 'timestamp' : 'ISO date'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMs(SAMPLE_MS)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <WandSparkles className="h-3.5 w-3.5" />
            Load sample
          </button>
          <button
            type="button"
            onClick={() => setMs(0)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Unix timestamp ({unit})
            </span>
            <CopyButton value={formatField('timestamp')} />
          </div>
          <input
            type="text"
            value={fieldValue('timestamp')}
            onFocus={() => handleFocus('timestamp')}
            onChange={(e) => handleChange('timestamp', e.target.value)}
            onBlur={handleBlur}
            spellCheck={false}
            className={`bg-white px-3 py-2.5 font-mono text-sm focus:outline-none dark:bg-zinc-950 dark:text-zinc-200 ${
              invalidField === 'timestamp' ? 'text-red-500' : 'text-zinc-800'
            }`}
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              ISO 8601 (UTC)
            </span>
            <CopyButton value={formatField('iso')} />
          </div>
          <input
            type="text"
            value={fieldValue('iso')}
            onFocus={() => handleFocus('iso')}
            onChange={(e) => handleChange('iso', e.target.value)}
            onBlur={handleBlur}
            spellCheck={false}
            className={`bg-white px-3 py-2.5 font-mono text-sm focus:outline-none dark:bg-zinc-950 dark:text-zinc-200 ${
              invalidField === 'iso' ? 'text-red-500' : 'text-zinc-800'
            }`}
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Local date &amp; time
            </span>
          </div>
          <input
            type="datetime-local"
            step="1"
            value={toDatetimeLocalValue(ms)}
            onChange={(e) => {
              const parsed = fromDatetimeLocalValue(e.target.value)
              if (parsed !== null) setMs(parsed)
            }}
            className="bg-white px-3 py-2.5 font-mono text-sm text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Relative
            </span>
          </div>
          <div className="bg-white px-3 py-2.5 font-mono text-sm text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {formatRelative(ms)}
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
