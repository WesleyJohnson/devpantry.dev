import { useMemo, useState } from 'react'
import { AlertTriangle, RotateCcw, ShieldCheck, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { sanitizeEnv, type RedactionReason } from '@/lib/envSanitizer'

const SAMPLE = `# DevPantry API — local development environment
NODE_ENV=development
PORT=4000
APP_NAME=devpantry-api

DATABASE_URL=postgres://devpantry:sup3rS3cret!@db.internal:5432/devpantry
STRIPE_SECRET_KEY="sk_live_51H8xJ2eZvKYlo2C9pXtRandomTestValue1234567890"
JWT_SECRET=f4a9c1e2b6d8f0a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1
WEBHOOK_ID=8f14e45fceea167a5a36dedd4bea2543
DEBUG=true`

const REASON_LABEL: Record<RedactionReason, string> = {
  name: 'name',
  'connection-string': 'connection string',
  value: 'value pattern',
}

export default function EnvSanitizer() {
  const [input, setInput] = useState(SAMPLE)

  const { output, redacted, warnings } = useMemo(() => sanitizeEnv(input), [input])
  const hasInput = input.trim().length > 0

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
          {hasInput && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                redacted.length > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {redacted.length > 0
                ? `${redacted.length} value${redacted.length === 1 ? '' : 's'} redacted`
                : 'No secrets found'}
            </span>
          )}
        </div>
      </div>

      {redacted.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <span className="font-medium">Redacted:</span>
          {redacted.map((entry, i) => (
            <span key={`${entry.key}-${i}`} className="rounded bg-amber-100 px-1.5 py-0.5 dark:bg-amber-500/20">
              {entry.key} <span className="opacity-70">({REASON_LABEL[entry.reason]})</span>
            </span>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              .env input
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Paste your .env file here..."
            className="min-h-[360px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Sanitized
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[360px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            <pre className="font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{output}</pre>
          </div>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
