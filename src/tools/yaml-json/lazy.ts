import { lazy } from 'react'

// js-yaml adds ~18KB gzipped — not huge, but only this one tool needs it, so
// it's kept out of the shared bundle every other tool page pays for, same
// reasoning as the token-counter/context-window-packer split.
const YamlJsonTool = lazy(() => import('@/tools/yaml-json/YamlJsonTool'))

export default YamlJsonTool
