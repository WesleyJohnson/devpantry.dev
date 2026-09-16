export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrGenerateResult {
  dataUrl: string
  svg: string
  error: string | null
}

// qrcode and jsQR are each dynamically imported inside their own function
// rather than statically at the top of the file, so generating never
// downloads jsQR (~47KB gzipped) and reading never downloads qrcode's
// encoder (~9KB gzipped).
export async function generateQrCode(text: string, level: ErrorCorrectionLevel): Promise<QrGenerateResult> {
  if (!text.trim()) return { dataUrl: '', svg: '', error: null }
  try {
    const QRCode = await import('qrcode')
    const [dataUrl, svg] = await Promise.all([
      QRCode.toDataURL(text, { errorCorrectionLevel: level, margin: 2, scale: 6 }),
      QRCode.toString(text, { type: 'svg', errorCorrectionLevel: level, margin: 2 }),
    ])
    return { dataUrl, svg, error: null }
  } catch (e) {
    return { dataUrl: '', svg: '', error: e instanceof Error ? e.message : "Couldn't generate a QR code for that input." }
  }
}

export interface QrReadResult {
  data: string | null
  error: string | null
}

export async function readQrCode(imageData: ImageData): Promise<QrReadResult> {
  const { default: jsQR } = await import('jsqr')
  const result = jsQR(imageData.data, imageData.width, imageData.height)
  if (!result) return { data: null, error: "Couldn't find a QR code in that image." }
  return { data: result.data, error: null }
}
