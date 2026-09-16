import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, Download, RotateCcw, Upload, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { buildDataUri, COMMON_IMAGE_MIME_TYPES, looksLikeBase64, parseDataUri } from '@/lib/base64Image'

type Mode = 'encode' | 'decode'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function Base64ImageTool() {
  const [mode, setMode] = useState<Mode>('encode')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Encode state
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [dataUri, setDataUri] = useState('')
  const [encodeError, setEncodeError] = useState<string | null>(null)

  // Decode state
  const [decodeInput, setDecodeInput] = useState('')
  const [decodeMime, setDecodeMime] = useState<string>(COMMON_IMAGE_MIME_TYPES[0])
  const [imageStatus, setImageStatus] = useState<'idle' | 'loaded' | 'error'>('idle')
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)

  const base64Only = useMemo(() => (dataUri ? parseDataUri(dataUri)?.base64 ?? '' : ''), [dataUri])

  const decodeDataUri = useMemo(() => {
    const trimmed = decodeInput.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('data:')) return trimmed
    if (!looksLikeBase64(trimmed)) return ''
    return buildDataUri(trimmed, decodeMime)
  }, [decodeInput, decodeMime])

  const decodeInputError = useMemo(() => {
    const trimmed = decodeInput.trim()
    if (!trimmed) return null
    if (!trimmed.startsWith('data:') && !looksLikeBase64(trimmed)) {
      return "Doesn't look like base64 — expected a data: URI or a plain base64 payload."
    }
    return null
  }, [decodeInput])

  function handleFile(file: File) {
    setEncodeError(null)
    if (!file.type.startsWith('image/')) {
      setEncodeError(`"${file.name}" isn't an image (detected type: ${file.type || 'unknown'}).`)
      setDataUri('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setDataUri(typeof reader.result === 'string' ? reader.result : '')
      setFileName(file.name)
      setFileSize(file.size)
    }
    reader.onerror = () => setEncodeError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  function reset() {
    setDataUri('')
    setFileName(null)
    setFileSize(null)
    setEncodeError(null)
    setDecodeInput('')
    setImageStatus('idle')
    setDimensions(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {mode === 'encode' ? (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-zinc-600"
            >
              <Upload className="h-6 w-6" />
              Click to choose an image
            </button>

            {encodeError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                {encodeError}
              </div>
            )}

            {dataUri && (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <img src={dataUri} alt={fileName ?? ''} className="h-16 w-16 rounded object-contain" />
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="font-medium text-zinc-700 dark:text-zinc-300">{fileName}</div>
                  <div>
                    {fileSize !== null && formatBytes(fileSize)} → {formatBytes(dataUri.length)} as base64
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Data URI
                </span>
                <CopyButton value={dataUri} />
              </div>
              <pre className="min-h-[100px] overflow-auto whitespace-pre-wrap break-all bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {dataUri}
              </pre>
            </div>
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Base64 only
                </span>
                <CopyButton value={base64Only} />
              </div>
              <pre className="min-h-[100px] overflow-auto whitespace-pre-wrap break-all bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {base64Only}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Data URI or base64
              </span>
              {!decodeInput.trim().startsWith('data:') && (
                <select
                  value={decodeMime}
                  onChange={(e) => setDecodeMime(e.target.value)}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  {COMMON_IMAGE_MIME_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <textarea
              value={decodeInput}
              onChange={(e) => {
                setDecodeInput(e.target.value)
                setImageStatus('idle')
                setDimensions(null)
              }}
              spellCheck={false}
              placeholder="Paste a data:image/... URI or raw base64 here..."
              className="min-h-[280px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
            />
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Preview
              </span>
              {imageStatus === 'loaded' && (
                <a
                  href={decodeDataUri}
                  download={`decoded.${decodeMime.split('/')[1]?.replace('svg+xml', 'svg') ?? 'png'}`}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              )}
            </div>
            <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-3 bg-white p-4 dark:bg-zinc-950">
              {decodeInputError ? (
                <p className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {decodeInputError}
                </p>
              ) : decodeDataUri ? (
                <>
                  <img
                    src={decodeDataUri}
                    alt="Decoded"
                    className="max-h-48 max-w-full rounded object-contain"
                    onLoad={(e) => {
                      setImageStatus('loaded')
                      setDimensions({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
                    }}
                    onError={() => {
                      setImageStatus('error')
                      setDimensions(null)
                    }}
                  />
                  {imageStatus === 'loaded' && dimensions && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {dimensions.w} × {dimensions.h}px
                    </span>
                  )}
                  {imageStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-xs text-red-500">
                      <XCircle className="h-3.5 w-3.5" />
                      Could not decode this as an image.
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-600">No image yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
