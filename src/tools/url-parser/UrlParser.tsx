import { useMemo, useState } from 'react'
import { CheckCircle2, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { parseUrl, formatUrlSummary, type ParsedUrlInfo } from '@/lib/urlParser'

const SAMPLE = 'https://user:pass@www.example.com:8443/search/results?q=devpantry&sort=stars&sort=forks&page=2#reviews'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2 text-sm">
      <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="break-all text-right font-mono text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  )
}

function DetailRows({ info }: { info: ParsedUrlInfo }) {
  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      <Row label="Protocol" value={info.protocol} />
      {info.username && <Row label="Username" value={info.username} />}
      {info.password && <Row label="Password" value={info.password} />}
      <Row label="Host" value={info.host} />
      <Row label="Hostname" value={info.hostname} />
      {info.port && <Row label="Port" value={info.port} />}
      <Row label="Path" value={info.pathname || '/'} />
      {info.search && <Row label="Query" value={info.search} />}
      {info.hash && <Row label="Hash" value={info.hash} />}
    </div>
  )
}

export default function UrlParser() {
  const [input, setInput] = useState(SAMPLE)

  const { info, error } = useMemo(() => parseUrl(input), [input])
  const isValid = input.trim().length > 0 && !error
  const summary = info ? formatUrlSummary(info) : ''

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
              {isValid ? 'Parsed' : "Couldn't parse"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            URL
          </span>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Paste a URL here..."
          className="bg-white px-4 py-3 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : (
        info && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Details
                </span>
                <CopyButton value={summary} />
              </div>
              <DetailRows info={info} />
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Query parameters ({info.params.length})
                </span>
              </div>
              {info.params.length === 0 ? (
                <p className="p-4 text-sm text-zinc-400 dark:text-zinc-600">No query parameters.</p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {info.params.map((p, i) => (
                    <div key={`${p.key}-${i}`} className="flex items-start justify-between gap-4 px-3 py-2 text-sm">
                      <span className="shrink-0 font-mono text-zinc-500 dark:text-zinc-400">{p.key}</span>
                      <span className="break-all text-right font-mono text-zinc-800 dark:text-zinc-200">
                        {p.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
