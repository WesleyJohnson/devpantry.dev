import { useMemo, useState } from 'react'
import { CheckCircle2, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { evaluateContrast, parseAnyColor } from '@/lib/contrastChecker'
import { formatHex } from '@/lib/colorConverter'

const SAMPLE_FG = '#3B82F6'
const SAMPLE_BG = '#FFFFFF'

function VerdictRow({ label, pass, ratioLabel }: { label: string; pass: boolean; ratioLabel: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <div>
        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">requires {ratioLabel}</div>
      </div>
      <span
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          pass
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
        }`}
      >
        {pass ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {pass ? 'Pass' : 'Fail'}
      </span>
    </div>
  )
}

export default function ContrastCheckerTool() {
  const [fgInput, setFgInput] = useState(SAMPLE_FG)
  const [bgInput, setBgInput] = useState(SAMPLE_BG)

  const fg = useMemo(() => parseAnyColor(fgInput), [fgInput])
  const bg = useMemo(() => parseAnyColor(bgInput), [bgInput])
  const verdict = useMemo(() => (fg && bg ? evaluateContrast(fg, bg) : null), [fg, bg])

  const fgError = fgInput.trim().length > 0 && !fg
  const bgError = bgInput.trim().length > 0 && !bg

  function loadSample() {
    setFgInput(SAMPLE_FG)
    setBgInput(SAMPLE_BG)
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
            setFgInput('')
            setBgInput('')
          }}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Text color
              </span>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 dark:bg-zinc-950">
              <input
                type="color"
                value={fg ? formatHex(fg) : '#000000'}
                onChange={(e) => setFgInput(e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700"
              />
              <input
                type="text"
                value={fgInput}
                onChange={(e) => setFgInput(e.target.value)}
                spellCheck={false}
                placeholder="#3B82F6, rgb(59,130,246), hsl(217,91%,60%)"
                className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-sm focus:outline-none ${
                  fgError
                    ? 'border-red-300 text-red-600 dark:border-red-500/40'
                    : 'border-zinc-200 text-zinc-800 dark:border-zinc-700 dark:text-zinc-200'
                } bg-white dark:bg-zinc-950`}
              />
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Background color
              </span>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 dark:bg-zinc-950">
              <input
                type="color"
                value={bg ? formatHex(bg) : '#ffffff'}
                onChange={(e) => setBgInput(e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700"
              />
              <input
                type="text"
                value={bgInput}
                onChange={(e) => setBgInput(e.target.value)}
                spellCheck={false}
                placeholder="#FFFFFF, rgb(255,255,255), hsl(0,0%,100%)"
                className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-sm focus:outline-none ${
                  bgError
                    ? 'border-red-300 text-red-600 dark:border-red-500/40'
                    : 'border-zinc-200 text-zinc-800 dark:border-zinc-700 dark:text-zinc-200'
                } bg-white dark:bg-zinc-950`}
              />
            </div>
          </div>

          <div
            className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"
            style={{ backgroundColor: bg ? formatHex(bg) : undefined, color: fg ? formatHex(fg) : undefined }}
          >
            <span className="text-2xl font-bold">The quick brown fox</span>
            <span className="text-sm">jumps over the lazy dog (normal text)</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Contrast ratio</span>
            <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              {verdict ? `${verdict.ratio.toFixed(2)}:1` : '—'}
            </span>
          </div>

          {verdict ? (
            <>
              <VerdictRow label="AA — Normal text" pass={verdict.aaNormal} ratioLabel="4.5:1" />
              <VerdictRow label="AA — Large text (18pt+ / 14pt+ bold)" pass={verdict.aaLarge} ratioLabel="3:1" />
              <VerdictRow label="AAA — Normal text" pass={verdict.aaaNormal} ratioLabel="7:1" />
              <VerdictRow label="AAA — Large text" pass={verdict.aaaLarge} ratioLabel="4.5:1" />
              <VerdictRow label="AA — UI components / graphics" pass={verdict.aaUiComponent} ratioLabel="3:1" />
            </>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
              Enter two valid colors to check contrast
            </div>
          )}
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
