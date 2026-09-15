import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import {
  decodeUlidTimestamp,
  decodeUuid,
  generateUlid,
  generateUuidV4,
  isUlid,
  isUuid,
} from '@/lib/uuidUlid'

type GenerateType = 'uuid' | 'ulid'

export default function UuidUlidTool() {
  const [generateType, setGenerateType] = useState<GenerateType>('uuid')
  const [generated, setGenerated] = useState(() => generateUuidV4())
  const [decodeInput, setDecodeInput] = useState(() => generateUuidV4())

  function regenerate(type: GenerateType) {
    setGenerated(type === 'uuid' ? generateUuidV4() : generateUlid())
  }

  function handleTypeChange(type: GenerateType) {
    setGenerateType(type)
    regenerate(type)
  }

  const decoded = useMemo(() => {
    const trimmed = decodeInput.trim()
    if (!trimmed) return { kind: 'empty' as const }
    if (isUuid(trimmed)) {
      const info = decodeUuid(trimmed)
      return info ? { kind: 'uuid' as const, info } : { kind: 'invalid' as const }
    }
    if (isUlid(trimmed)) {
      const ms = decodeUlidTimestamp(trimmed)
      return ms !== null ? { kind: 'ulid' as const, ms } : { kind: 'invalid' as const }
    }
    return { kind: 'invalid' as const }
  }, [decodeInput])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Generate
          </span>
          <SegmentedControl
            options={['uuid', 'ulid'] as const}
            value={generateType}
            onChange={handleTypeChange}
            labels={{ uuid: 'UUID v4', ulid: 'ULID' }}
          />
          <button
            type="button"
            onClick={() => regenerate(generateType)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate new
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-lg text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <span className="break-all">{generated}</span>
          <CopyButton value={generated} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Decode
        </span>

        <input
          type="text"
          value={decodeInput}
          onChange={(e) => setDecodeInput(e.target.value)}
          spellCheck={false}
          placeholder="Paste a UUID or ULID here..."
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        />

        {decoded.kind === 'invalid' && (
          <p className="text-xs text-red-500">
            That doesn't look like a valid UUID or ULID.
          </p>
        )}

        {decoded.kind === 'uuid' && (
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                UUID details
              </span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Version</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{decoded.info.version}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Variant</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{decoded.info.variant}</span>
              </div>
            </div>
          </div>
        )}

        {decoded.kind === 'ulid' && (
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                ULID details
              </span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Timestamp (ms)</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{decoded.ms}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Created at (UTC)</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {new Date(decoded.ms).toISOString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
