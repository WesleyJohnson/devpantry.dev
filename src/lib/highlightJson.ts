function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const TOKEN_PATTERN =
  /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

/**
 * Tokenizes already-valid JSON text into color-coded spans.
 * HTML is escaped before tokenizing, so the result is safe to render
 * with dangerouslySetInnerHTML even if the JSON contains user-provided strings.
 */
export function highlightJson(json: string): string {
  const escaped = escapeHtml(json)
  return escaped.replace(TOKEN_PATTERN, (match) => {
    let className = 'text-amber-500 dark:text-amber-300' // number
    if (match.startsWith('"')) {
      className = /:$/.test(match)
        ? 'text-sky-600 dark:text-sky-400' // key
        : 'text-emerald-600 dark:text-emerald-400' // string
    } else if (match === 'true' || match === 'false') {
      className = 'text-purple-600 dark:text-purple-400'
    } else if (match === 'null') {
      className = 'text-zinc-500'
    }
    return `<span class="${className}">${match}</span>`
  })
}
