import { CORE_SCHEMA, dump, loadAll, mergeTag, realMapTag } from 'js-yaml'

// The bare CORE_SCHEMA (js-yaml's default) parses "<<: *anchor" as a literal
// "<<" string key rather than actually merging the anchor's fields in —
// js-yaml ships mergeTag/realMapTag as an explicit, still-safe opt-in for
// that common idiom (docker-compose, CI configs), so this enables it rather
// than surprising users who expect the merge to actually happen.
const SCHEMA = CORE_SCHEMA.withTags(mergeTag, realMapTag)

export interface ConversionResult {
  output: string
  error: string | null
  warning: string | null
}

// realMapTag (enabled above) represents every YAML mapping as a real Map
// rather than a plain object — that's what makes merge keys and non-string
// keys work correctly — but JSON.stringify has no special handling for Map
// and silently serializes one as "{}". This walks the parsed result
// converting every Map (at any depth, including ones nested in arrays) into
// a plain object before it reaches JSON.stringify.
function mapToPlain(value: unknown): unknown {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {}
    for (const [key, v] of value) obj[String(key)] = mapToPlain(v)
    return obj
  }
  if (Array.isArray(value)) return value.map(mapToPlain)
  return value
}

// js-yaml's default schema (CORE_SCHEMA as of v5) supports only YAML 1.2's
// core types — str/int/float/bool/null/timestamp/binary/seq/map — with none
// of the old !!js/function or !!js/regexp tags that made v3's plain load()
// capable of arbitrary code execution on untrusted input. Nothing here opts
// into a wider schema, so parsing a user's pasted YAML stays safe.
export function yamlToJson(input: string): ConversionResult {
  if (!input.trim()) return { output: '', error: null, warning: null }
  let docs: unknown[]
  try {
    docs = loadAll(input, { schema: SCHEMA })
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : 'Invalid YAML', warning: null }
  }

  if (docs.length === 0) return { output: '', error: null, warning: null }
  if (docs.length === 1) return { output: JSON.stringify(mapToPlain(docs[0]), null, 2), error: null, warning: null }

  return {
    output: JSON.stringify(docs.map(mapToPlain), null, 2),
    error: null,
    warning: `Input contained ${docs.length} YAML documents (separated by ---) — combined into a JSON array in document order.`,
  }
}

export function jsonToYaml(input: string): ConversionResult {
  if (!input.trim()) return { output: '', error: null, warning: null }
  let parsed: unknown
  try {
    parsed = JSON.parse(input)
  } catch (e) {
    return { output: '', error: `Invalid JSON: ${(e as Error).message}`, warning: null }
  }

  try {
    // lineWidth: -1 disables js-yaml's default line-wrapping of long scalars
    // into folded block style — that rewrapping is a readability nicety for
    // hand-written YAML, but for a round-trip conversion tool it risks
    // surprising a user who pastes a long single-line string and gets back
    // multi-line YAML. noRefs skips anchor/alias generation for repeated
    // object references, which JSON.parse never produces anyway (every
    // object it creates is distinct), but keeps output format stable if
    // that ever changes upstream.
    const output = dump(parsed, { lineWidth: -1, noRefs: true })
    return { output, error: null, warning: null }
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : "Couldn't convert to YAML", warning: null }
  }
}
