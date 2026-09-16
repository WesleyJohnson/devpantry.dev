import { lazy } from 'react'

// qrcode (~9KB gzipped) and jsQR (~47KB gzipped) are each dynamically
// imported inside qrCode.ts itself, split per generate/read function so
// switching modes only downloads the library that mode actually needs.
const QrCodeTool = lazy(() => import('@/tools/qr-code/QrCodeTool'))

export default QrCodeTool
