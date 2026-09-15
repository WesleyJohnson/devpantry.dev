import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { urlDecode, urlEncode, type UrlEncodingScope } from '@/lib/urlEncoding'

const SAMPLE_TEXT = 'https://example.com/search?q=devpantry tools&sort=stars'
const SAMPLE_COMPONENT = 'sort by stars & forks'

type Mode = 'encode' | 'decode'

export default function UrlEncodeTool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [scope, setScope] = useState<UrlEncodingScope>('component')
  const [encodeInput, setEncodeInput] = useState(SAMPLE_COMPONENT)
  const [decodeInput, setDecodeInput] = useState(encodeURIComponent(SAMPLE_COMPONENT))

  const isEncode = mode === 'encode'
  const input = isEncode ? encodeInput : decodeInput
  const setInput = isEncode ? setEncodeInput : setDecodeInput

  const { output, error } = useMemo(() => {
    if (isEncode) return { output: urlEncode(encodeInput, scope), error: null }
    return urlDecode(decodeInput, scope)
  }, [isEncode, encodeInput, decodeInput, scope])

  function loadSample() {
    setEncodeInput(scope === 'component' ? SAMPLE_COMPONENT : SAMPLE_TEXT)
    setDecodeInput(
      scope === 'component' ? encodeURIComponent(SAMPLE_COMPONENT) : encodeURI(SAMPLE_TEXT),
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['encode', 'decode'] as const}
          value={mode}
          onChange={setMode}
          labels={{ encode: 'Encode', decode: 'Decode' }}
        />
        <SegmentedControl
          options={['component', 'full'] as const}
          value={scope}
          onChange={setScope}
          labels={{ component: 'Component', full: 'Full URI' }}
        />

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
            onClick={() => setInput('')}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        {scope === 'component'
          ? 'Component: escapes everything except unreserved characters — use this for a single value going into a query string or path segment.'
          : 'Full URI: leaves reserved characters (/ ? & : # etc.) alone — use this for an already-assembled URL.'}
      </p>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isEncode ? 'Text' : 'Encoded'}
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={isEncode ? 'Type or paste text here...' : 'Paste URL-encoded text here...'}
            className="min-h-[300px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {isEncode ? 'Encoded' : 'Text'}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[300px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {error ? (
              <p className="font-mono text-sm text-red-500">{error}</p>
            ) : (
              <pre className="font-mono text-sm leading-relaxed break-all whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
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
