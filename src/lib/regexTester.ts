export interface RegexFlags {
  g: boolean
  i: boolean
  m: boolean
  s: boolean
  u: boolean
  y: boolean
  d: boolean
}

export const DEFAULT_FLAGS: RegexFlags = {
  g: true,
  i: false,
  m: false,
  s: false,
  u: false,
  y: false,
  d: false,
}

export function buildFlagString(flags: RegexFlags): string {
  return (['g', 'i', 'm', 's', 'u', 'y', 'd'] as const).filter((f) => flags[f]).join('')
}

export interface CompileResult {
  regex: RegExp | null
  error: string | null
}

// The exact flags the user chose — this is the regex their own code would
// run, used for the replace preview, so that behavior (e.g. replacing only
// the first match without the g flag) matches reality exactly.
export function compileRegex(pattern: string, flags: RegexFlags): CompileResult {
  if (!pattern) return { regex: null, error: null }
  try {
    return { regex: new RegExp(pattern, buildFlagString(flags)), error: null }
  } catch (err) {
    return { regex: null, error: err instanceof Error ? err.message : 'Invalid regular expression' }
  }
}

export interface MatchInfo {
  index: number
  match: string
  groups: (string | undefined)[]
  namedGroups: Record<string, string | undefined>
}

function toMatchInfo(m: RegExpMatchArray | RegExpExecArray): MatchInfo {
  return {
    index: m.index ?? 0,
    match: m[0],
    groups: Array.from(m).slice(1),
    namedGroups: m.groups ? { ...m.groups } : {},
  }
}

// Without the g flag, .exec()/.match() only ever return the first match —
// that is a real semantic difference (not a limitation of this tool), so it
// is preserved here rather than silently forcing g on to find "all" matches.
export function findMatches(regex: RegExp, text: string): MatchInfo[] {
  if (regex.global) {
    return [...text.matchAll(regex)].map(toMatchInfo)
  }
  const m = regex.exec(text)
  return m ? [toMatchInfo(m)] : []
}

export interface ReplaceResult {
  output: string
  error: string | null
}

export function replaceMatches(regex: RegExp, text: string, replacement: string): ReplaceResult {
  try {
    return { output: text.replace(regex, replacement), error: null }
  } catch (err) {
    return { output: '', error: err instanceof Error ? err.message : "Couldn't apply replacement" }
  }
}
