import { lazy } from 'react'

// js-beautify (HTML beautifier, ~30KB gzipped) is statically imported inside
// htmlFormatter.ts; the minify path also pulls in Terser via jsFormatter.ts,
// which is itself dynamically imported there. Lazy-loading this tool keeps
// all of that out of the shared bundle for every other tool page.
const HtmlFormatterTool = lazy(() => import('@/tools/html-formatter/HtmlFormatterTool'))

export default HtmlFormatterTool
