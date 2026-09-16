import { lazy } from 'react'

// marked adds ~13KB gzipped — only this tool needs it, so it stays out of
// the shared bundle every other tool page pays for, same reasoning as the
// yaml-json/token-counter splits.
const MarkdownPreviewTool = lazy(() => import('@/tools/markdown-preview/MarkdownPreviewTool'))

export default MarkdownPreviewTool
