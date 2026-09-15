import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { highlightJson } from '@/lib/highlightJson'
import { decodeJwt, getClaimTimeStatus } from '@/lib/jwt'

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMDFIWDlRSyIsIm5hbWUiOiJBZGEgTG92ZWxhY2UiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6NDEwMjQ0NDgwMH0.ZGV2cGFudHJ5LXNhbXBsZS1zaWduYXR1cmUtbm90LXJlYWw'

export default function JwtDecoder() {
  const [input, setInput] = useState(SAMPLE)

  const { decoded, error } = useMemo(() => decodeJwt(input), [input])
  const isValid = input.trim().length > 0 && !error
  const timeStatus = useMemo(
    () => (decoded ? getClaimTimeStatus(decoded.payload) : { kind: 'none' as const }),
    [decoded],
  )

  const headerHighlighted = useMemo(() => (decoded ? highlightJson(decoded.headerRaw) : ''), [decoded])
  const payloadHighlighted = useMemo(() => (decoded ? highlightJson(decoded.payloadRaw) : ''), [decoded])

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
              {isValid ? 'Decoded' : 'Invalid token'}
            </span>
          )}
        </div>
      </div>

      {timeStatus.kind !== 'none' && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
            timeStatus.kind === 'expired'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
              : timeStatus.kind === 'not-yet-valid'
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
          }`}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {timeStatus.kind === 'expired' &&
            `Expired ${timeStatus.relative} ago (${timeStatus.at.toLocaleString()})`}
          {timeStatus.kind === 'not-yet-valid' &&
            `Not valid yet — becomes active in ${timeStatus.relative} (${timeStatus.at.toLocaleString()})`}
          {timeStatus.kind === 'active' &&
            `Valid for ${timeStatus.relative} more (until ${timeStatus.at.toLocaleString()})`}
        </div>
      )}

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Token
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Paste a JWT here..."
          className="min-h-[100px] resize-none break-all bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : (
        decoded && (
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Header
                </span>
                <CopyButton value={decoded.headerRaw} />
              </div>
              <div className="min-h-[220px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
                <pre className="font-mono text-sm leading-relaxed">
                  <code dangerouslySetInnerHTML={{ __html: headerHighlighted }} />
                </pre>
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Payload
                </span>
                <CopyButton value={decoded.payloadRaw} />
              </div>
              <div className="min-h-[220px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
                <pre className="font-mono text-sm leading-relaxed">
                  <code dangerouslySetInnerHTML={{ __html: payloadHighlighted }} />
                </pre>
              </div>
            </div>
          </div>
        )
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
