import { lazy } from 'react'

// ajv (+ ajv-formats, + the per-dialect 2019/2020 builds when needed) is
// dynamically imported inside jsonSchemaValidator.ts itself, ~41KB gzipped
// for the common draft-07 case — only paid by someone who opens this tool.
const JsonSchemaValidatorTool = lazy(() => import('@/tools/json-schema-validator/JsonSchemaValidatorTool'))

export default JsonSchemaValidatorTool
