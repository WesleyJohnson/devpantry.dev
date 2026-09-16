export interface ValidationError {
  instancePath: string
  message: string
  keyword: string
}

export interface SchemaValidateResult {
  valid: boolean | null // null = couldn't run (schema or data error)
  errors: ValidationError[]
  error: string | null // schema/data parse or compile error, distinct from validation errors
}

// ajv is dynamically imported so its ~41KB gzipped (with ajv-formats) is
// only paid by someone who opens this tool. It compiles each schema into a
// validator function via `new Function(...)` — a standard, browser-safe
// JIT technique (the same category of thing Vue's template compiler does),
// not a network or file-system capability, and it compiles the users own
// pasted schema, not anything fetched remotely.
export async function validateAgainstSchema(schemaText: string, dataText: string): Promise<SchemaValidateResult> {
  if (!schemaText.trim() || !dataText.trim()) return { valid: null, errors: [], error: null }

  let schema: unknown
  try {
    schema = JSON.parse(schemaText)
  } catch (e) {
    return { valid: null, errors: [], error: `Invalid schema JSON: ${(e as Error).message}` }
  }

  let data: unknown
  try {
    data = JSON.parse(dataText)
  } catch (e) {
    return { valid: null, errors: [], error: `Invalid data JSON: ${(e as Error).message}` }
  }

  try {
    // The default `ajv` export only ships the draft-07 meta-schema — a
    // schema declaring 2019-09 or 2020-12 via "$schema" needs Ajv's
    // dedicated per-dialect build instead, confirmed by testing a 2020-12
    // schema against plain Ajv and getting "no schema with key or ref"
    // rather than it silently falling back to a close-enough dialect.
    const dialect = typeof schema === 'object' && schema !== null && '$schema' in schema ? String((schema as { $schema: unknown }).$schema) : ''
    const [{ default: AjvClass }, { default: addFormats }] = await Promise.all([
      dialect.includes('2020-12') ? import('ajv/dist/2020.js') : dialect.includes('2019-09') ? import('ajv/dist/2019.js') : import('ajv'),
      import('ajv-formats'),
    ])
    const ajv = new AjvClass({ allErrors: true, strict: false })
    addFormats(ajv)
    const validate = ajv.compile(schema as object)
    const valid = validate(data)
    const errors: ValidationError[] = (validate.errors ?? []).map((e) => ({
      instancePath: e.instancePath || '/',
      message: e.message ?? 'is invalid',
      keyword: e.keyword,
    }))
    return { valid, errors, error: null }
  } catch (e) {
    return { valid: null, errors: [], error: e instanceof Error ? e.message : "Couldn't compile that schema." }
  }
}
