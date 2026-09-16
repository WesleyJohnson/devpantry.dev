import { lazy } from 'react'

// @peculiar/x509 and its ASN.1 schema dependencies add ~54KB gzipped —
// only this tool needs it, so it stays out of the shared bundle every other
// tool page pays for, same reasoning as the other Tier 3 dependency splits.
const X509DecoderTool = lazy(() => import('@/tools/x509-decoder/X509DecoderTool'))

export default X509DecoderTool
