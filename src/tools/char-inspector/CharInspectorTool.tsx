import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { inspectText } from '@/lib/charInspector'

const SAMPLE = 'Hi​ there! 😀 café — “quoted”'

const CATEGORY_STYLES: Record<string, string> = {
  Letter: 'text-blue-600 dark:text-blue-400',
  Mark: 'text-purple-600 dark:text-purple-400',
  Number: 'text-emerald-600 dark:text-emerald-400',
  Punctuation: 'text-amber-600 dark:text-amber-400',
  Symbol: 'text-pink-600 dark:text-pink-400',
  Separator: 'text-zinc-400 dark:text-zinc-600',
  Control: 'text-red-600 dark:text-red-400',
  Other: 'text-zinc-500 dark:text-zinc-400',
}

export default function CharInspectorTool() {
  const [input, setInput] = useState(SAMPLE)
  const result = useMemo(() => inspectText(input), [input])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Load sample
        </button>
        <button
          type="button"
          onClick={() => setInput('')}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{result.codepointCount} codepoints</span>
          <span>{result.graphemeCount} graphemes</span>
          <span>{result.utf16UnitLength} UTF-16 units</span>
          <span>{result.utf8ByteLength} UTF-8 bytes</span>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Text</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Type or paste text to inspect..."
          className="min-h-[100px] resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Codepoints
          </span>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2 font-medium">Char</th>
                <th className="px-3 py-2 font-medium">Codepoint</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">UTF-8</th>
                <th className="px-3 py-2 font-medium">UTF-16</th>
                <th className="px-3 py-2 font-medium">HTML entity</th>
                <th className="px-3 py-2 font-medium">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white font-mono dark:divide-zinc-800 dark:bg-zinc-950">
              {result.codepoints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-zinc-400 dark:text-zinc-600">
                    Nothing to inspect yet
                  </td>
                </tr>
              ) : (
                result.codepoints.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 text-sm">
                      <span className="inline-block min-w-[1.5em] rounded bg-zinc-100 px-1.5 py-0.5 text-center dark:bg-zinc-800">
                        {c.category === 'Control' || c.category === 'Separator' ? '·' : c.char}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">{c.hex}</td>
                    <td className={`px-3 py-1.5 ${CATEGORY_STYLES[c.category]}`}>{c.category}</td>
                    <td className="px-3 py-1.5">{c.utf8Bytes}</td>
                    <td className="px-3 py-1.5">{c.utf16Units}</td>
                    <td className="px-3 py-1.5">{c.htmlEntityHex}</td>
                    <td className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400">{c.name ?? ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
