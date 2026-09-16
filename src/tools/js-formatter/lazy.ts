import { lazy } from 'react'

// The tool shell itself is tiny — prettier (~170KB gzipped) and terser
// (~140KB gzipped) are dynamically imported inside jsFormatter.ts itself,
// split per beautify/minify mode so switching modes does not force
// downloading both.
const JsFormatterTool = lazy(() => import('@/tools/js-formatter/JsFormatterTool'))

export default JsFormatterTool
