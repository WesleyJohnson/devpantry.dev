import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Download, RotateCcw, Upload, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { generateQrCode, readQrCode, type ErrorCorrectionLevel } from '@/lib/qrCode'

type Mode = 'generate' | 'read'

const SAMPLE = 'https://devpantry.dev'
const DEBOUNCE_MS = 250

function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) {
        reject(new Error('Could not get a 2D canvas context.'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Couldn't load that file as an image."))
    }
    img.src = url
  })
}

export default function QrCodeTool() {
  const [mode, setMode] = useState<Mode>('generate')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate state
  const [text, setText] = useState(SAMPLE)
  const [level, setLevel] = useState<ErrorCorrectionLevel>('M')
  const [dataUrl, setDataUrl] = useState('')
  const [svg, setSvg] = useState('')
  const [genError, setGenError] = useState<string | null>(null)

  // Read state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [decoded, setDecoded] = useState<string | null>(null)
  const [readError, setReadError] = useState<string | null>(null)

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl('')
      setSvg('')
      setGenError(null)
      return
    }
    let cancelled = false
    const timeout = setTimeout(() => {
      generateQrCode(text, level).then((result) => {
        if (cancelled) return
        setDataUrl(result.dataUrl)
        setSvg(result.svg)
        setGenError(result.error)
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [text, level])

  async function handleFile(file: File) {
    setDecoded(null)
    setReadError(null)
    setPreviewUrl(URL.createObjectURL(file))
    try {
      const imageData = await fileToImageData(file)
      const result = await readQrCode(imageData)
      setDecoded(result.data)
      setReadError(result.error)
    } catch (e) {
      setReadError(e instanceof Error ? e.message : "Couldn't read that image.")
    }
  }

  function reset() {
    setText('')
    setPreviewUrl(null)
    setDecoded(null)
    setReadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['generate', 'read'] as const}
          value={mode}
          onChange={setMode}
          labels={{ generate: 'Generate', read: 'Read' }}
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

      {mode === 'generate' ? (
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Text or URL
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                placeholder="Enter text or a URL to encode..."
                className="min-h-[140px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Error correction</span>
              <SegmentedControl
                options={['L', 'M', 'Q', 'H'] as const}
                value={level}
                onChange={setLevel}
                labels={{ L: 'L (7%)', M: 'M (15%)', Q: 'Q (25%)', H: 'H (30%)' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  QR code
                </span>
                {dataUrl && !genError && (
                  <a
                    href={dataUrl}
                    download="qrcode.png"
                    className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PNG
                  </a>
                )}
              </div>
              <div className="flex min-h-[220px] flex-1 items-center justify-center bg-white p-4 dark:bg-zinc-950">
                {genError ? (
                  <p className="flex items-center gap-2 text-sm text-red-500">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {genError}
                  </p>
                ) : dataUrl ? (
                  <img src={dataUrl} alt="Generated QR code" className="h-48 w-48" />
                ) : (
                  <span className="text-sm text-zinc-400 dark:text-zinc-600">Enter text to generate a QR code</span>
                )}
              </div>
            </div>

            {svg && !genError && (
              <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    SVG source
                  </span>
                  <CopyButton value={svg} />
                </div>
                <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                  {svg}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
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
              className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-zinc-600"
            >
              <Upload className="h-6 w-6" />
              Click to choose an image with a QR code
            </button>
            {previewUrl && (
              <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <img src={previewUrl} alt="Uploaded" className="max-h-40 max-w-full object-contain" />
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Decoded text
              </span>
              {decoded && <CopyButton value={decoded} />}
            </div>
            <div className="flex min-h-[220px] flex-1 items-center justify-center bg-white p-4 dark:bg-zinc-950">
              {readError ? (
                <p className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {readError}
                </p>
              ) : decoded ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <p className="break-all font-mono text-sm text-zinc-800 dark:text-zinc-200">{decoded}</p>
                </div>
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
