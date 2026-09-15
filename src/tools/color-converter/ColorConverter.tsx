import { useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import {
  formatCmyk,
  formatHex,
  formatHsl,
  formatHsv,
  formatRgb,
  hexToRgba,
  parseCmykString,
  parseHslString,
  parseHsvString,
  parseRgbString,
  rgbaToHex,
  type RGBA,
} from '@/lib/colorConverter'

const SAMPLE_COLOR: RGBA = { r: 59, g: 130, b: 246, a: 1 } // matches this app's accent blue
const RESET_COLOR: RGBA = { r: 0, g: 0, b: 0, a: 1 }

type FieldKey = 'hex' | 'rgb' | 'hsl' | 'hsb' | 'cmyk'

interface FieldConfig {
  label: string
  format: (c: RGBA) => string
  parse: (s: string) => RGBA | null
  placeholder: string
}

const FIELDS: Record<FieldKey, FieldConfig> = {
  hex: { label: 'HEX', format: formatHex, parse: (s) => hexToRgba(s.trim()), placeholder: '#3B82F6' },
  rgb: { label: 'RGB', format: formatRgb, parse: parseRgbString, placeholder: 'rgb(59, 130, 246)' },
  hsl: { label: 'HSL', format: formatHsl, parse: parseHslString, placeholder: 'hsl(217, 91%, 60%)' },
  hsb: { label: 'HSB', format: formatHsv, parse: parseHsvString, placeholder: 'hsb(217, 76%, 96%)' },
  cmyk: { label: 'CMYK', format: formatCmyk, parse: parseCmykString, placeholder: 'cmyk(76%, 47%, 0%, 4%)' },
}

const FIELD_ORDER: FieldKey[] = ['hex', 'rgb', 'hsl', 'hsb', 'cmyk']

export default function ColorConverter() {
  const [color, setColor] = useState<RGBA>(SAMPLE_COLOR)
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null)
  const [draftText, setDraftText] = useState('')
  const [invalidField, setInvalidField] = useState<FieldKey | null>(null)

  function fieldValue(key: FieldKey): string {
    return focusedField === key ? draftText : FIELDS[key].format(color)
  }

  function handleFocus(key: FieldKey) {
    setFocusedField(key)
    setDraftText(FIELDS[key].format(color))
    setInvalidField(null)
  }

  function handleChange(key: FieldKey, value: string) {
    setDraftText(value)
    const parsed = FIELDS[key].parse(value)
    if (parsed) {
      setColor(parsed)
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
        <button
          type="button"
          onClick={() => setColor(SAMPLE_COLOR)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Load sample
        </button>

        <button
          type="button"
          onClick={() => setColor(RESET_COLOR)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <div className="ml-auto">
          {invalidField && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
              Invalid {FIELDS[invalidField].label} value
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div
          className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
          style={{
            backgroundImage: 'repeating-conic-gradient(#d4d4d8 0% 25%, transparent 0% 50%)',
            backgroundSize: '12px 12px',
          }}
        >
          <div className="h-full w-full" style={{ backgroundColor: formatRgb(color) }} />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="color-picker">
            Pick
          </label>
          <input
            id="color-picker"
            type="color"
            value={rgbaToHex({ ...color, a: 1 }).slice(0, 7)}
            onChange={(e) => {
              const parsed = hexToRgba(e.target.value)
              if (parsed) setColor((prev) => ({ ...parsed, a: prev.a }))
            }}
            className="h-9 w-9 cursor-pointer rounded-md border border-zinc-200 bg-transparent dark:border-zinc-700"
          />
        </div>

        <div className="flex min-w-[160px] flex-1 items-center gap-2">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="alpha-slider">
            Alpha
          </label>
          <input
            id="alpha-slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(color.a * 100)}
            onChange={(e) => setColor((prev) => ({ ...prev, a: Number(e.target.value) / 100 }))}
            className="flex-1"
          />
          <span className="w-10 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {Math.round(color.a * 100)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELD_ORDER.map((key) => (
          <div
            key={key}
            className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {FIELDS[key].label}
              </span>
              <CopyButton value={FIELDS[key].format(color)} />
            </div>
            <input
              type="text"
              value={fieldValue(key)}
              onFocus={() => handleFocus(key)}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={handleBlur}
              spellCheck={false}
              placeholder={FIELDS[key].placeholder}
              className={`bg-white px-3 py-2.5 font-mono text-sm focus:outline-none dark:bg-zinc-950 dark:text-zinc-200 ${
                invalidField === key ? 'text-red-500' : 'text-zinc-800'
              }`}
            />
          </div>
        ))}
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
