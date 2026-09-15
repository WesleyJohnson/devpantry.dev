import { useMemo, useState } from 'react'
import { RotateCcw, WandSparkles } from 'lucide-react'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { analyzeText } from '@/lib/stringInspector'

const SAMPLE = `DevPantry.dev is a client-side developer toolbelt. Every tool runs entirely in
your browser — no sign-up, no server round-trip, no data leaves your machine.

Paste anything here to see character, word, and line counts update live.`

function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return '0 min'
  if (minutes < 1) return '< 1 min'
  return `${Math.round(minutes)} min`
}

export default function StringInspector() {
  const [input, setInput] = useState(SAMPLE)
  const stats = useMemo(() => analyzeText(input), [input])

  const tiles: { label: string; value: string }[] = [
    { label: 'Characters', value: stats.characters.toLocaleString() },
    { label: 'Characters (no spaces)', value: stats.charactersNoSpaces.toLocaleString() },
    { label: 'Words', value: stats.words.toLocaleString() },
    { label: 'Lines', value: stats.lines.toLocaleString() },
    { label: 'Sentences', value: stats.sentences.toLocaleString() },
    { label: 'Bytes (UTF-8)', value: stats.bytes.toLocaleString() },
    { label: 'Unique characters', value: stats.uniqueCharacters.toLocaleString() },
    { label: 'Longest line', value: `${stats.longestLine.toLocaleString()} chars` },
    { label: 'Reading time', value: formatReadingTime(stats.readingTimeMinutes) },
  ]

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
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Text
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          placeholder="Paste or type text here..."
          className="min-h-[240px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex flex-col gap-1 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {tile.label}
            </span>
            <span className="font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {tile.value}
            </span>
          </div>
        ))}
      </div>

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
