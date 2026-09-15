import { useEffect, useState } from 'react'
import { Loader2, RotateCcw, WandSparkles } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import {
  digest,
  hmac,
  DIGEST_ALGORITHMS,
  HMAC_ALGORITHMS,
  type DigestAlgorithm,
  type HmacAlgorithm,
} from '@/lib/hash'

const SAMPLE = 'The quick brown fox jumps over the lazy dog'

type Mode = 'hash' | 'hmac'

export default function HashHmacGenerator() {
  const [mode, setMode] = useState<Mode>('hash')
  const [input, setInput] = useState(SAMPLE)
  const [hashAlgorithm, setHashAlgorithm] = useState<DigestAlgorithm>('SHA-256')
  const [hmacAlgorithm, setHmacAlgorithm] = useState<HmacAlgorithm>('SHA-256')
  const [hmacKey, setHmacKey] = useState('super-secret-key')
  const [output, setOutput] = useState('')
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (mode === 'hmac' && !hmacKey) {
      setOutput('')
      setComputing(false)
      return
    }

    setComputing(true)
    const task =
      mode === 'hash' ? digest(hashAlgorithm, input) : hmac(hmacAlgorithm, hmacKey, input)

    task
      .then((hex) => {
        if (!cancelled) {
          setOutput(hex)
          setComputing(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOutput('')
          setComputing(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [mode, input, hashAlgorithm, hmacAlgorithm, hmacKey])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl options={['hash', 'hmac'] as const} value={mode} onChange={setMode} />

        {mode === 'hash' ? (
          <SegmentedControl options={DIGEST_ALGORITHMS} value={hashAlgorithm} onChange={setHashAlgorithm} />
        ) : (
          <SegmentedControl options={HMAC_ALGORITHMS} value={hmacAlgorithm} onChange={setHmacAlgorithm} />
        )}

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
          {computing && (
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Computing
            </span>
          )}
        </div>
      </div>

      {mode === 'hmac' && (
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Secret key
            </span>
          </div>
          <input
            type="text"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            spellCheck={false}
            placeholder="Enter a secret key..."
            className="bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Text
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="Type or paste text here..."
            className="min-h-[280px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Digest (hex){output && <span className="ml-1 normal-case text-zinc-400 dark:text-zinc-600">· {output.length * 4}-bit</span>}
            </span>
            <CopyButton value={output} />
          </div>
          <div className="min-h-[280px] flex-1 overflow-auto bg-white p-4 dark:bg-zinc-950">
            {mode === 'hmac' && !hmacKey ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">Enter a secret key to compute the HMAC.</p>
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
