import less from 'less'
import * as sass from 'sass'
import { formatCss } from '@/lib/cssFormatter'

export type PreprocessorLang = 'less' | 'scss'
export type OutputMode = 'beautify' | 'minify'

export interface PreprocessorResult {
  output: string
  error: string | null
  warnings: string[]
}

// LESS's browser build ships a built-in FileManager that resolves @import
// statements over the network via XMLHttpRequest against whatever URL it
// resolves relative to the current page — confirmed present in the bundled
// browser build (dist/less.js), not just a name in some unrelated table.
// This plugin registers a FileManager that claims to support every path and
// always rejects, and since LESS searches its file managers most-recently-
// added-first, this one is found before the default XHR-capable one — so no
// @import in a users pasted LESS snippet can ever trigger a network request,
// it just surfaces a clear "not supported" error instead. Verified the
// interception itself in Node; Sass has no built-in network importer at all
// (compileString with an unresolvable @use just errors, confirmed directly),
// so it needs no equivalent guard.
class NoImportFileManager {
  supports(): boolean {
    return true
  }
  supportsSync(): boolean {
    return true
  }
  loadFile(filename: string): Promise<never> {
    return Promise.reject(
      new Error(`Cannot resolve "@import ${JSON.stringify(filename)}" — this tool only compiles a single self-contained snippet, external imports are not supported.`),
    )
  }
}

const noImportLessPlugin: Less.Plugin = {
  install(_lessInstance, pluginManager) {
    pluginManager.addFileManager(new NoImportFileManager() as unknown as Less.FileManager)
  },
}

async function compileLess(input: string): Promise<PreprocessorResult> {
  try {
    const result = await less.render(input, { plugins: [noImportLessPlugin] })
    return { output: result.css, error: null, warnings: [] }
  } catch (e) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e)
    return { output: '', error: message, warnings: [] }
  }
}

// Sass logs deprecation warnings (e.g. legacy color functions like darken())
// straight to the console by default — noisy for a tool where practically
// any snippet using an older Sass idiom would spam the browser console on
// every keystroke. A custom logger captures them as data instead, surfaced
// in the UI like any other tool's warnings rather than console output.
function compileScss(input: string): PreprocessorResult {
  const warnings: string[] = []
  try {
    const result = sass.compileString(input, {
      syntax: 'scss',
      logger: { warn: (message) => warnings.push(message.split('\n')[0]) },
    })
    return { output: result.css, error: null, warnings }
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message.split('\n')[0] : "Couldn't compile SCSS", warnings: [] }
  }
}

export async function compileToCss(input: string, lang: PreprocessorLang, mode: OutputMode): Promise<PreprocessorResult> {
  if (!input.trim()) return { output: '', error: null, warnings: [] }

  const compiled = lang === 'less' ? await compileLess(input) : compileScss(input)
  if (compiled.error) return compiled

  // Reuses the Tier 2 CSS formatter for the beautify/minify step, since the
  // compiler's own output is already plain CSS at that point — no reason to
  // hand-roll a second formatting pass for it.
  const formatted = formatCss(compiled.output, mode)
  return formatted.error
    ? { output: '', error: formatted.error, warnings: compiled.warnings }
    : { output: formatted.output, error: null, warnings: compiled.warnings }
}
