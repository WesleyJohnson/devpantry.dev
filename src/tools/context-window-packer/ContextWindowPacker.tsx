import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, UploadCloud, RotateCcw, WandSparkles, X } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { countExactTokens, estimateApproxTokens, type ExactEncodingId } from '@/lib/tokenCounter'
import { packSnippets, formatPackedOutput, readTextFiles, type Snippet, type RejectedFile } from '@/lib/contextPacker'

type Tokenizer = ExactEncodingId | 'approx'

const INITIAL_BUDGET = 128_000
const INITIAL_TOKENIZER: Tokenizer = 'o200k_base'

const BUDGET_PRESETS = [
  { label: '8K', value: 8_000 },
  { label: '32K', value: 32_000 },
  { label: '128K', value: 128_000 },
  { label: '200K', value: 200_000 },
  { label: '1M', value: 1_000_000 },
]

const SAMPLE_SNIPPETS: Omit<Snippet, 'id'>[] = [
  {
    label: 'auth.ts',
    source: 'paste',
    content: `export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing token' })

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}`,
  },
  {
    label: 'error.log',
    source: 'paste',
    content: `2026-09-14T22:41:03.201Z ERROR [auth] TokenExpiredError: jwt expired
    at requireAuth (/app/src/middleware/auth.ts:14:11)
    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
2026-09-14T22:41:03.204Z INFO  [auth] 401 returned to 203.0.113.42`,
  },
  {
    label: 'README.md',
    source: 'paste',
    content: `# devpantry-api

Internal API for DevPantry.dev. Handles auth, snippet storage, and usage metering.

## Local dev
npm install
npm run dev`,
  },
]

function withIds(snippets: Omit<Snippet, 'id'>[]): Snippet[] {
  return snippets.map((s) => ({ ...s, id: crypto.randomUUID() }))
}

export default function ContextWindowPacker() {
  const [snippets, setSnippets] = useState<Snippet[]>(() => withIds(SAMPLE_SNIPPETS))
  const [tokenCounts, setTokenCounts] = useState<Map<string, number>>(new Map())
  const [computing, setComputing] = useState(false)
  const [budget, setBudget] = useState(INITIAL_BUDGET)
  const [tokenizer, setTokenizer] = useState<Tokenizer>(INITIAL_TOKENIZER)
  const [labelInput, setLabelInput] = useState('')
  const [contentInput, setContentInput] = useState('')
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    setComputing(true)
    Promise.all(
      snippets.map(async (s) => {
        const count = tokenizer === 'approx' ? estimateApproxTokens(s.content) : await countExactTokens(tokenizer, s.content)
        return [s.id, count] as const
      }),
    ).then((entries) => {
      if (!cancelled) {
        setTokenCounts(new Map(entries))
        setComputing(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [snippets, tokenizer])

  const packResult = useMemo(() => packSnippets(snippets, tokenCounts, budget), [snippets, tokenCounts, budget])
  const output = useMemo(() => formatPackedOutput(snippets, packResult.includedIds), [snippets, packResult.includedIds])
  const usedPct = budget > 0 ? (packResult.includedTokens / budget) * 100 : 0
  const excludedCount = snippets.length - packResult.includedIds.size

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) return
    const { accepted, rejected } = await readTextFiles(files)
    if (accepted.length > 0) {
      setSnippets((prev) => [
        ...prev,
        ...accepted.map((f) => ({ id: crypto.randomUUID(), label: f.label, content: f.content, source: 'file' as const })),
      ])
    }
    setRejectedFiles(rejected)
  }

  function handleAddPaste() {
    if (!labelInput.trim() || !contentInput.trim()) return
    setSnippets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: labelInput.trim(), content: contentInput, source: 'paste' },
    ])
    setLabelInput('')
    setContentInput('')
  }

  function removeSnippet(id: string) {
    setSnippets((prev) => prev.filter((s) => s.id !== id))
  }

  function moveSnippet(id: string, dir: -1 | 1) {
    setSnippets((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      const newIdx = idx + dir
      if (idx === -1 || newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.splice(newIdx, 0, item)
      return copy
    })
  }

  function loadSample() {
    setSnippets(withIds(SAMPLE_SNIPPETS))
    setBudget(INITIAL_BUDGET)
    setTokenizer(INITIAL_TOKENIZER)
    setRejectedFiles([])
  }

  function resetAll() {
    setSnippets([])
    setBudget(INITIAL_BUDGET)
    setTokenizer(INITIAL_TOKENIZER)
    setRejectedFiles([])
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setDragActive(true)
  }
  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    setDragActive(false)
  }
  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragActive(false)
    void handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['o200k_base', 'cl100k_base', 'approx'] as const}
          value={tokenizer}
          onChange={setTokenizer}
          labels={{ o200k_base: 'GPT-4o / 4.1', cl100k_base: 'GPT-3.5 / 4', approx: 'Other (approx.)' }}
        />

        <div className="flex items-center gap-1">
          {BUDGET_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setBudget(p.value)}
              className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                budget === p.value
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <input
          type="number"
          min={0}
          value={budget}
          onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
          className="w-28 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        />
        <span className="text-xs text-zinc-400 dark:text-zinc-600">token budget</span>

        <div className="ml-auto flex items-center gap-2">
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
            onClick={resetAll}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
            dragActive
              ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10'
              : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
          }`}
        >
          <UploadCloud className="h-5 w-5 text-zinc-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Drag files here, or click to browse</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">Text files only, 2MB max each — read locally, never uploaded</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Snippet label (e.g. notes.md)"
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          />
          <textarea
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="Paste text to add as a snippet..."
            className="min-h-[64px] flex-1 resize-none rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
          />
          <button
            type="button"
            onClick={handleAddPaste}
            disabled={!labelInput.trim() || !contentInput.trim()}
            className="self-start rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Add snippet
          </button>
        </div>
      </div>

      {rejectedFiles.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <ul className="list-disc space-y-1 pl-4">
            {rejectedFiles.map((f) => (
              <li key={f.label}>
                {f.label}: {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <span>
            {packResult.includedTokens.toLocaleString()} / {budget.toLocaleString()} tokens
            {computing && <span className="ml-1 text-zinc-400 dark:text-zinc-600">(computing...)</span>}
          </span>
          <span className={usedPct > 100 ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-600'}>
            {Math.round(usedPct)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full transition-all ${usedPct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, usedPct)}%` }}
          />
        </div>
        {excludedCount > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {excludedCount} snippet{excludedCount === 1 ? '' : 's'} excluded — over budget.
          </p>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Snippets ({snippets.length})
          </span>
        </div>
        {snippets.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400 dark:text-zinc-600">No snippets yet — add files or paste text above.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {snippets.map((s, i) => {
              const included = packResult.includedIds.has(s.id)
              const count = tokenCounts.get(s.id)
              return (
                <li key={s.id} className={`flex items-center gap-3 px-3 py-2.5 ${included ? '' : 'opacity-50'}`}>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => moveSnippet(s.id, -1)}
                      className="rounded text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === snippets.length - 1}
                      onClick={() => moveSnippet(s.id, 1)}
                      className="rounded text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                      s.source === 'file'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {s.source}
                  </span>
                  <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">{s.label}</span>
                  <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {count === undefined ? '...' : count.toLocaleString()} tok
                  </span>
                  {!included && <span className="text-[10px] font-medium uppercase text-red-500">excluded</span>}
                  <button
                    type="button"
                    onClick={() => removeSnippet(s.id)}
                    className="text-zinc-400 hover:text-red-500"
                    aria-label={`Remove ${s.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Packed output
          </span>
          <CopyButton value={output} />
        </div>
        <div className="max-h-[400px] min-h-[160px] overflow-auto bg-white p-4 dark:bg-zinc-950">
          {output ? (
            <pre className="font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{output}</pre>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">Nothing packed yet.</p>
          )}
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
