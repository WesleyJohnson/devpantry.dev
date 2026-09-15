// Shared quote- and bracket-aware text scanners used by the code-generation
// tools (curl<->fetch, SQL->Zod) so a comma or colon inside a string or a
// nested literal is never mistaken for a top-level separator.

export function skipString(str: string, start: number): number {
  const quote = str[start]
  let i = start + 1
  while (i < str.length) {
    if (str[i] === '\\') {
      i += 2
      continue
    }
    if (str[i] === quote) return i
    i++
  }
  return str.length - 1
}

export function extractBalanced(str: string, openIndex: number, open: string, close: string): number {
  let depth = 0
  for (let i = openIndex; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(str, i)
      continue
    }
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

export function splitTopLevel(str: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipString(str, i)
      current += str.slice(i, end + 1)
      i = end
      continue
    }
    if ('{[('.includes(ch)) depth++
    if ('}])'.includes(ch)) depth--
    if (ch === separator && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim() !== '') parts.push(current)
  return parts
}

export function findTopLevelChar(str: string, char: string): number {
  let depth = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(str, i)
      continue
    }
    if ('{[('.includes(ch)) depth++
    if ('}])'.includes(ch)) depth--
    if (ch === char && depth === 0) return i
  }
  return -1
}
