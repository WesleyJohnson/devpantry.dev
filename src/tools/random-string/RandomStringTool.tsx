import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { buildCharset, generateRandomString } from '@/lib/randomString'

const LENGTH_PRESETS = [8, 16, 32, 64]

export default function RandomStringTool() {
  const [length, setLength] = useState(32)
  const [lowercase, setLowercase] = useState(true)
  const [uppercase, setUppercase] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(false)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [nonce, setNonce] = useState(0)

  const charset = buildCharset({ lowercase, uppercase, digits, symbols }, excludeAmbiguous)

  // nonce has no effect on the recipe — it exists purely so "Generate new"
  // can force a fresh value even when length/charset have not changed.
  const output = useMemo(() => generateRandomString(length, charset), [length, charset, nonce])

  function regenerate() {
    setNonce((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {LENGTH_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setLength(preset)}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                length === preset
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          max={512}
          value={length}
          onChange={(e) => setLength(Math.min(512, Math.max(1, Number(e.target.value) || 1)))}
          className="w-20 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        />
        <span className="text-xs text-zinc-400 dark:text-zinc-600">characters</span>

        <div className="ml-auto">
          <button
            type="button"
            onClick={regenerate}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate new
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={lowercase}
            onChange={(e) => setLowercase(e.target.checked)}
            className="accent-emerald-500"
          />
          Lowercase (a-z)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            className="accent-emerald-500"
          />
          Uppercase (A-Z)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={digits}
            onChange={(e) => setDigits(e.target.checked)}
            className="accent-emerald-500"
          />
          Digits (0-9)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={symbols}
            onChange={(e) => setSymbols(e.target.checked)}
            className="accent-emerald-500"
          />
          Symbols (!@#$...)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            className="accent-emerald-500"
          />
          Exclude ambiguous (0 O 1 l I)
        </label>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Result
          </span>
          <CopyButton value={output} />
        </div>
        <div className="bg-white p-4 dark:bg-zinc-950">
          {charset.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              Select at least one character set above.
            </p>
          ) : (
            <p className="break-all font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {output}
            </p>
          )}
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
