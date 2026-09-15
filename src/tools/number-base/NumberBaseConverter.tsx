import { useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { formatInBase, parseInBase } from '@/lib/numberBase'

const SAMPLE_VALUE = 3735928559n // 0xDEADBEEF

type FieldKey = 'bin' | 'oct' | 'dec' | 'hex' | 'custom'

export default function NumberBaseConverter() {
  const [value, setValue] = useState<bigint>(SAMPLE_VALUE)
  const [customBase, setCustomBase] = useState(36)
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null)
  const [draftText, setDraftText] = useState('')
  const [invalidField, setInvalidField] = useState<FieldKey | null>(null)

  function baseFor(key: FieldKey): number {
    if (key === 'bin') return 2
    if (key === 'oct') return 8
    if (key === 'dec') return 10
    if (key === 'hex') return 16
    return customBase
  }

  function fieldValue(key: FieldKey): string {
    if (focusedField === key) return draftText
    return formatInBase(value, baseFor(key))
  }

  function handleFocus(key: FieldKey) {
    setFocusedField(key)
    setDraftText(formatInBase(value, baseFor(key)))
    setInvalidField(null)
  }

  function handleChange(key: FieldKey, text: string) {
    setDraftText(text)
    const parsed = parseInBase(text, baseFor(key))
    if (parsed !== null) {
      setValue(parsed)
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

  function handleCustomBaseChange(next: number) {
    const clamped = Math.min(36, Math.max(2, next))
    setCustomBase(clamped)
    if (focusedField === 'custom') {
      setDraftText(formatInBase(value, clamped))
      setInvalidField(null)
    }
  }

  const fields: { key: FieldKey; label: string }[] = [
    { key: 'bin', label: 'Binary (base 2)' },
    { key: 'oct', label: 'Octal (base 8)' },
    { key: 'dec', label: 'Decimal (base 10)' },
    { key: 'hex', label: 'Hexadecimal (base 16)' },
  ]

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setValue(SAMPLE_VALUE)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Load sample
        </button>

        <button
          type="button"
          onClick={() => setValue(0n)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <div className="ml-auto">
          {invalidField && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
              Invalid value for base {baseFor(invalidField)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div
            key={key}
            className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
              </span>
              <CopyButton value={formatInBase(value, baseFor(key))} />
            </div>
            <input
              type="text"
              value={fieldValue(key)}
              onFocus={() => handleFocus(key)}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={handleBlur}
              spellCheck={false}
              className={`bg-white px-3 py-2.5 font-mono text-sm focus:outline-none dark:bg-zinc-950 dark:text-zinc-200 ${
                invalidField === key ? 'text-red-500' : 'text-zinc-800'
              }`}
            />
          </div>
        ))}

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Custom base
              </span>
              <input
                type="number"
                min={2}
                max={36}
                value={customBase}
                onChange={(e) => handleCustomBaseChange(Number(e.target.value) || 2)}
                className="w-14 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              />
            </div>
            <CopyButton value={formatInBase(value, customBase)} />
          </div>
          <input
            type="text"
            value={fieldValue('custom')}
            onFocus={() => handleFocus('custom')}
            onChange={(e) => handleChange('custom', e.target.value)}
            onBlur={handleBlur}
            spellCheck={false}
            className={`bg-white px-3 py-2.5 font-mono text-sm focus:outline-none dark:bg-zinc-950 dark:text-zinc-200 ${
              invalidField === 'custom' ? 'text-red-500' : 'text-zinc-800'
            }`}
          />
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
