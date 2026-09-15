import { lazy } from 'react'

// Split into its own module (rather than defined inline in lib/tools.tsx) so
// that file stays data-only — mixing a component definition into a file that
// also exports plain data/functions breaks React Fast Refresh's boundary
// detection.
const TokenCounter = lazy(() => import('@/tools/token-counter/TokenCounter'))

export default TokenCounter
