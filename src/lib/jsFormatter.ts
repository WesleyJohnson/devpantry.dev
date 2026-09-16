export interface JsFormatResult {
  output: string
  error: string | null
}

// Prettier (beautify, ~170KB gzipped with the babel+estree plugins it needs
// to parse and reprint JS) and terser (minify, ~140KB gzipped) are each
// dynamically imported here rather than statically at the top of the file,
// so Vite puts them in separate chunks — picking Beautify only ever
// downloads prettier, and Minify only ever downloads terser, not both.
export async function beautifyJs(input: string): Promise<JsFormatResult> {
  if (!input.trim()) return { output: '', error: null }
  try {
    const [prettier, babelPlugin, estreePlugin] = await Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/babel').then((m) => m.default),
      import('prettier/plugins/estree').then((m) => m.default),
    ])
    const output = await prettier.format(input, {
      parser: 'babel',
      plugins: [babelPlugin, estreePlugin],
      semi: true,
      singleQuote: false,
      tabWidth: 2,
      printWidth: 80,
    })
    return { output, error: null }
  } catch (e) {
    // Prettier's parse errors are short and already point at the exact
    // spot (a "> 1 | ...\n    |    ^" snippet), unlike sql-formatter's
    // multi-thousand-line grammar trace — safe to show in full.
    return { output: '', error: e instanceof Error ? e.message : "Couldn't format JavaScript" }
  }
}

export async function minifyJs(input: string): Promise<JsFormatResult> {
  if (!input.trim()) return { output: '', error: null }
  try {
    const { minify } = await import('terser')
    const result = await minify(input, { compress: true, mangle: true })
    return { output: result.code ?? '', error: null }
  } catch (e) {
    if (e instanceof Error && 'line' in e && 'col' in e) {
      const { line, col } = e as Error & { line: number; col: number }
      return { output: '', error: `${e.message} (line ${line}, column ${col})` }
    }
    return { output: '', error: e instanceof Error ? e.message : "Couldn't minify JavaScript" }
  }
}
