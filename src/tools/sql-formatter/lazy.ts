import { lazy } from 'react'

// sql-formatter with a curated 7-dialect subset still adds ~32KB gzipped —
// only this tool needs it, so it stays out of the shared bundle, same
// reasoning as the other Tier 3 dependency splits.
const SqlFormatterTool = lazy(() => import('@/tools/sql-formatter/SqlFormatterTool'))

export default SqlFormatterTool
