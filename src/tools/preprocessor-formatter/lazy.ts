import { lazy } from 'react'

// less (~115KB gzipped) and sass (Dart Sass compiled to JS, ~870KB gzipped —
// large, but the same order of magnitude already accepted for js-tiktoken's
// rank tables) are both statically imported inside preprocessorFormatter.ts.
// Lazy-loading this tool keeps both out of the shared bundle for every other
// tool page.
const PreprocessorFormatterTool = lazy(() => import('@/tools/preprocessor-formatter/PreprocessorFormatterTool'))

export default PreprocessorFormatterTool
