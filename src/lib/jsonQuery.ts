export type QueryLanguage = 'jmespath' | 'jsonpath'

export interface QueryResult {
  output: string
  error: string | null
  matchCount: number | null
}

// Both libraries are tiny (~6-8KB gzipped each) and dynamically imported
// together here — no need for the per-language chunk splitting used for
// larger pairs like Prettier/Terser, but still kept out of the main bundle
// via this tool's own lazy-loaded route.
export async function runQuery(dataText: string, expression: string, lang: QueryLanguage): Promise<QueryResult> {
  if (!dataText.trim() || !expression.trim()) return { output: '', error: null, matchCount: null }

  let data: unknown
  try {
    data = JSON.parse(dataText)
  } catch (e) {
    return { output: '', error: `Invalid JSON: ${(e as Error).message}`, matchCount: null }
  }

  if (lang === 'jmespath') {
    try {
      const { search } = await import('jmespath')
      const result = search(data, expression)
      return { output: JSON.stringify(result, null, 2), error: null, matchCount: Array.isArray(result) ? result.length : null }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Invalid JMESPath expression.', matchCount: null }
    }
  }

  try {
    const { JSONPath } = await import('jsonpath-plus')
    const result = JSONPath({ path: expression, json: data as object })
    return { output: JSON.stringify(result, null, 2), error: null, matchCount: result.length }
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : 'Invalid JSONPath expression.', matchCount: null }
  }
}
