import { useEffect, useState } from 'react'
import { AlertTriangle, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { compileToCss, type OutputMode, type PreprocessorLang } from '@/lib/preprocessorFormatter'

const SAMPLES: Record<PreprocessorLang, string> = {
  less: `@base: #3b82f6;

.card {
  color: @base;
  padding: 1rem;

  .title {
    font-weight: bold;

    &:hover {
      color: lighten(@base, 10%);
    }
  }
}`,
  scss: `$base: #3b82f6;

@mixin flex-center {
  display: flex;
  align-items: center;
}

.card {
  color: $base;
  padding: 1rem;

  .title {
    font-weight: bold;

    &:hover {
      color: lighten($base, 10%);
    }
  }
}

.row {
  @include flex-center;
}`,
}

const DEBOUNCE_MS = 300

export default function PreprocessorFormatterTool() {
  const [lang, setLang] = useState<PreprocessorLang>('scss')
  const [mode, setMode] = useState<OutputMode>('beautify')
  const [input, setInput] = useState(SAMPLES.scss)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setWarnings([])
      setIsPending(false)
      return
    }
    setIsPending(true)
    let cancelled = false
    const timeout = setTimeout(() => {
      compileToCss(input, lang, mode).then((result) => {
        if (cancelled) return
        setOutput(result.output)
        setError(result.error)
        setWarnings(result.warnings)
        setIsPending(false)
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [input, lang, mode])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['less', 'scss'] as const}
          value={lang}
          onChange={(next) => {
            setLang(next)
            setInput(SAMPLES[next])
          }}
          labels={{ less: 'LESS', scss: 'SCSS' }}
        />
        <SegmentedControl
          options={['beautify', 'minify'] as const}
          value={mode}
          onChange={setMode}
          labels={{ beautify: 'Beautify', minify: 'Minify' }}
        />

        <button
          type="button"
          onClick={() => setInput(SAMPLES[lang])}
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
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {lang === 'less' ? 'LESS' : 'SCSS'} input
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={`Paste ${lang === 'less' ? 'LESS' : 'SCSS'} here...`}
            className="min-h-[380px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              CSS output
              {isPending && <span className="ml-1 text-zinc-400 dark:text-zinc-600">(working...)</span>}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[380px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
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

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
