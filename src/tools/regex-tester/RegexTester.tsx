import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, WandSparkles, XCircle } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import {
  buildFlagString,
  compileRegex,
  findMatches,
  replaceMatches,
  DEFAULT_FLAGS,
  type RegexFlags,
} from '@/lib/regexTester'
import { tokenizePattern, type TokenKind } from '@/lib/regexTokenizer'

const SAMPLE_PATTERN = String.raw`(?<user>[\w.]+)@(?<domain>[\w-]+\.\w+)`
const SAMPLE_TEXT = `Contact us at support@devpantry.dev or sales@example.co for help.
Invalid: not-an-email, missing@domain`
const SAMPLE_REPLACEMENT = '$<user> at $<domain>'

const FLAG_INFO: { key: keyof RegexFlags; label: string; title: string }[] = [
  { key: 'g', label: 'g', title: 'global — find all matches, not just the first' },
  { key: 'i', label: 'i', title: 'ignoreCase — case-insensitive matching' },
  { key: 'm', label: 'm', title: 'multiline — ^ and $ match at line breaks too' },
  { key: 's', label: 's', title: 'dotAll — . also matches newlines' },
  { key: 'u', label: 'u', title: 'unicode — treat the pattern as a sequence of code points' },
  { key: 'y', label: 'y', title: 'sticky — match only starting at lastIndex' },
  { key: 'd', label: 'd', title: 'hasIndices — track start/end indices of each capture group' },
]

const TOKEN_STYLES: Record<TokenKind, string> = {
  literal: 'text-zinc-700 dark:text-zinc-300',
  charClass: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10',
  escape: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10',
  anchor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
  quantifier: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
  groupOpen: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  groupClose: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  alternation: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10',
  dot: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
  backreference: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10',
}

const MATCH_STYLES = [
  'bg-emerald-200/70 dark:bg-emerald-500/30',
  'bg-sky-200/70 dark:bg-sky-500/30',
  'bg-amber-200/70 dark:bg-amber-500/30',
  'bg-fuchsia-200/70 dark:bg-fuchsia-500/30',
  'bg-orange-200/70 dark:bg-orange-500/30',
  'bg-rose-200/70 dark:bg-rose-500/30',
]

const MAX_RENDERED_MATCHES = 500

function renderHighlightedText(text: string, matches: { index: number; match: string }[]): ReactNode {
  if (matches.length === 0) return text
  const nodes: ReactNode[] = []
  let cursor = 0
  const shown = matches.slice(0, MAX_RENDERED_MATCHES)
  shown.forEach((m, i) => {
    if (m.index > cursor) nodes.push(text.slice(cursor, m.index))
    nodes.push(
      <mark key={i} className={`rounded px-0.5 ${MATCH_STYLES[i % MATCH_STYLES.length]}`} title={`Match ${i + 1}`}>
        {m.match || '​'}
      </mark>,
    )
    cursor = m.index + m.match.length
  })
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

export default function RegexTester() {
  const [pattern, setPattern] = useState(SAMPLE_PATTERN)
  const [flags, setFlags] = useState<RegexFlags>(DEFAULT_FLAGS)
  const [testText, setTestText] = useState(SAMPLE_TEXT)
  const [replacement, setReplacement] = useState(SAMPLE_REPLACEMENT)
  const [showReplace, setShowReplace] = useState(false)

  const { regex, error } = useMemo(() => compileRegex(pattern, flags), [pattern, flags])
  const matches = useMemo(() => (regex ? findMatches(regex, testText) : []), [regex, testText])
  const tokens = useMemo(() => (pattern ? tokenizePattern(pattern) : []), [pattern])
  const { output: replaced, error: replaceError } = useMemo(
    () => (regex ? replaceMatches(regex, testText, replacement) : { output: '', error: null }),
    [regex, testText, replacement],
  )

  function toggleFlag(key: keyof RegexFlags) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function loadSample() {
    setPattern(SAMPLE_PATTERN)
    setFlags(DEFAULT_FLAGS)
    setTestText(SAMPLE_TEXT)
    setReplacement(SAMPLE_REPLACEMENT)
  }

  function reset() {
    setPattern('')
    setTestText('')
    setReplacement('')
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {FLAG_INFO.map(({ key, label, title }) => (
            <button
              key={key}
              type="button"
              title={title}
              onClick={() => toggleFlag(key)}
              className={`h-7 w-7 rounded-md border text-xs font-semibold transition ${
                flags[key]
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={showReplace}
            onChange={(e) => setShowReplace(e.target.checked)}
            className="accent-emerald-500"
          />
          Replace mode
        </label>

        <div className="ml-auto flex items-center gap-2">
          {pattern.trim() && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                error
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}
            >
              {error ? 'Invalid regex' : `${matches.length} match${matches.length === 1 ? '' : 'es'}`}
            </span>
          )}
          <button
            type="button"
            onClick={loadSample}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <WandSparkles className="h-3.5 w-3.5" />
            Load sample
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Pattern
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white px-4 py-3 font-mono text-sm dark:bg-zinc-950">
          <span className="text-zinc-400 dark:text-zinc-600">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            placeholder="Enter a regular expression..."
            className="flex-1 bg-transparent text-zinc-800 focus:outline-none dark:text-zinc-200"
          />
          <span className="text-zinc-400 dark:text-zinc-600">/{buildFlagString(flags)}</span>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : (
        tokens.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Pattern breakdown — hover a piece for what it means
              </span>
            </div>
            <div className="flex flex-wrap gap-0.5 bg-white p-3 font-mono text-sm dark:bg-zinc-950">
              {tokens.map((t, i) => (
                <span key={i} title={t.description} className={`rounded px-0.5 ${TOKEN_STYLES[t.kind]}`}>
                  {t.text}
                </span>
              ))}
            </div>
          </div>
        )
      )}

      {!error && !flags.g && matches.length <= 1 && pattern.trim() && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Without the g flag, only the first match is found — toggle g to see every match.
        </p>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Test string
            </span>
          </div>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            spellCheck={false}
            placeholder="Paste text to test your pattern against..."
            className="min-h-[220px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Highlighted matches
            </span>
          </div>
          <div className="min-h-[220px] flex-1 overflow-auto bg-white p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            {renderHighlightedText(testText, matches)}
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Matches ({matches.length})
            </span>
          </div>
          <ul className="max-h-[320px] divide-y divide-zinc-100 overflow-auto dark:divide-zinc-800">
            {matches.slice(0, MAX_RENDERED_MATCHES).map((m, i) => (
              <li key={i} className="px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-600">Match {i + 1}</span>
                  <span className="break-all font-mono text-zinc-800 dark:text-zinc-200">
                    {m.match || '(empty match)'}
                  </span>
                </div>
                {(m.groups.length > 0 || Object.keys(m.namedGroups).length > 0) && (
                  <div className="mt-1.5 flex flex-col gap-1 border-l-2 border-zinc-100 pl-3 dark:border-zinc-800">
                    {m.groups.map((g, gi) => (
                      <div key={gi} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-zinc-400 dark:text-zinc-600">Group {gi + 1}</span>
                        <span className="break-all font-mono text-zinc-600 dark:text-zinc-400">
                          {g ?? '(no match)'}
                        </span>
                      </div>
                    ))}
                    {Object.entries(m.namedGroups).map(([name, value]) => (
                      <div key={name} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-zinc-400 dark:text-zinc-600">Group "{name}"</span>
                        <span className="break-all font-mono text-zinc-600 dark:text-zinc-400">
                          {value ?? '(no match)'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {matches.length > MAX_RENDERED_MATCHES && (
            <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2 text-xs text-amber-600 dark:border-zinc-800 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Showing the first {MAX_RENDERED_MATCHES} of {matches.length} matches.
            </div>
          )}
        </div>
      )}

      {showReplace && (
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Replacement ($1, $&lt;name&gt;, $&amp;, etc.)
            </span>
          </div>
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            spellCheck={false}
            placeholder="Replacement string..."
            className="border-b border-zinc-200 bg-white px-4 py-2.5 font-mono text-sm text-zinc-800 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          />
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Result
            </span>
            <CopyButton value={replaced} />
          </div>
          <div className="min-h-[100px] overflow-auto bg-white p-4 dark:bg-zinc-950">
            {replaceError ? (
              <p className="font-mono text-sm text-red-500">{replaceError}</p>
            ) : (
              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {replaced}
              </pre>
            )}
          </div>
        </div>
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
