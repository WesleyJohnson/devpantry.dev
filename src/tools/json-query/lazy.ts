import { lazy } from 'react'

// jmespath (~6KB gzipped) and jsonpath-plus (~8KB gzipped) are dynamically
// imported inside jsonQuery.ts — small enough not to need per-language
// chunk splitting, but still kept out of the shared bundle by lazy-loading
// this tool's whole route.
const JsonQueryTool = lazy(() => import('@/tools/json-query/JsonQueryTool'))

export default JsonQueryTool
