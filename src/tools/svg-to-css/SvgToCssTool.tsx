import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { svgToCss, type SvgEncoding } from '@/lib/svgToCss'

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
  <circle cx="12" cy="12" r="9" />
  <path d="M9 12l2 2 4-4" />
</svg>`

export default function SvgToCssTool() {
  const [input, setInput] = useState(SAMPLE)
  const [encoding, setEncoding] = useState<SvgEncoding>('url')

  const { dataUri, backgroundSnippet, maskSnippet, error } = useMemo(
    () => svgToCss(input, encoding),
    [input, encoding],
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['url', 'base64'] as const}
          value={encoding}
          onChange={setEncoding}
          labels={{ url: 'URL-encoded', base64: 'Base64' }}
        />

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
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              SVG source
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste your SVG source here..."
            className="min-h-[280px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Preview
              </span>
            </div>
            <div
              className="flex h-24 items-center justify-center bg-white dark:bg-zinc-950"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(#e4e4e7 0% 25%, transparent 0% 50%) 50% / 16px 16px',
              }}
            >
              {error ? (
                <XCircle className="h-6 w-6 text-red-400" />
              ) : dataUri ? (
                <div
                  className="h-16 w-16 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url("${dataUri}")` }}
                />
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          ) : (
            <>
              <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    background-image
                  </span>
                  <CopyButton value={backgroundSnippet} />
                </div>
                <pre className="overflow-auto whitespace-pre-wrap break-all bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                  {backgroundSnippet}
                </pre>
              </div>

              <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    mask-image
                  </span>
                  <CopyButton value={maskSnippet} />
                </div>
                <pre className="overflow-auto whitespace-pre-wrap break-all bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                  {maskSnippet}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
