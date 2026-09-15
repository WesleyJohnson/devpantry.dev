import { lazy } from 'react'

// Split into its own module (see token-counter/lazy.ts) — this tool also
// pulls in js-tiktoken's multi-megabyte rank tables via lib/tokenCounter.
const ContextWindowPacker = lazy(() => import('@/tools/context-window-packer/ContextWindowPacker'))

export default ContextWindowPacker
