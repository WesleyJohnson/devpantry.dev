import { useMemo, useState } from 'react'
import { AlertTriangle, RotateCcw, WandSparkles } from 'lucide-react'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'
import { SegmentedControl } from '@/components/SegmentedControl'
import { diffLines, toSideBySide, type DiffOp } from '@/lib/textDiff'

const SAMPLE_OLD = `function greet(name) {
  console.log("Hello, " + name);
}

greet("world");`

const SAMPLE_NEW = `function greet(name, greeting = "Hello") {
  console.log(\`\${greeting}, \${name}!\`);
}

greet("world");
greet("DevPantry", "Hey");`

type ViewMode = 'unified' | 'split'

const ROW_STYLES: Record<DiffOp, string> = {
  equal: 'bg-white dark:bg-zinc-950',
  add: 'bg-emerald-50 dark:bg-emerald-500/10',
  remove: 'bg-red-50 dark:bg-red-500/10',
}

const MARKER: Record<DiffOp, string> = { equal: ' ', add: '+', remove: '-' }
const MARKER_COLOR: Record<DiffOp, string> = {
  equal: 'text-zinc-300 dark:text-zinc-700',
  add: 'text-emerald-600 dark:text-emerald-400',
  remove: 'text-red-600 dark:text-red-400',
}

export default function TextDiffTool() {
  const [oldText, setOldText] = useState(SAMPLE_OLD)
  const [newText, setNewText] = useState(SAMPLE_NEW)
  const [view, setView] = useState<ViewMode>('unified')

  const result = useMemo(() => diffLines(oldText, newText), [oldText, newText])
  const sideBySideRows = useMemo(
    () => (view === 'split' && !result.error ? toSideBySide(result.lines) : []),
    [view, result],
  )

  function loadSample() {
    setOldText(SAMPLE_OLD)
    setNewText(SAMPLE_NEW)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={['unified', 'split'] as const}
          value={view}
          onChange={setView}
          labels={{ unified: 'Unified', split: 'Side by side' }}
        />

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
          onClick={() => {
            setOldText('')
            setNewText('')
          }}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        {!result.error && (
          <div className="ml-auto flex items-center gap-3 text-xs font-medium">
            <span className="text-emerald-600 dark:text-emerald-400">+{result.added}</span>
            <span className="text-red-600 dark:text-red-400">-{result.removed}</span>
            <span className="text-zinc-400 dark:text-zinc-600">{result.unchanged} unchanged</span>
          </div>
        )}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Original
            </span>
          </div>
          <textarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            spellCheck={false}
            placeholder="Paste the original text here..."
            className="min-h-[220px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Changed
            </span>
          </div>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            spellCheck={false}
            placeholder="Paste the changed text here..."
            className="min-h-[220px] flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-zinc-800 focus:outline-none dark:bg-zinc-950 dark:text-zinc-200"
          />
        </div>
      </div>

      {result.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {result.error}
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Diff
            </span>
          </div>

          {view === 'unified' ? (
            <div className="overflow-auto">
              {result.lines.map((line, i) => (
                <div key={i} className={`flex font-mono text-xs leading-relaxed ${ROW_STYLES[line.type]}`}>
                  <span className="w-10 shrink-0 select-none border-r border-zinc-100 px-2 text-right text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                    {line.oldLineNumber ?? ''}
                  </span>
                  <span className="w-10 shrink-0 select-none border-r border-zinc-100 px-2 text-right text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                    {line.newLineNumber ?? ''}
                  </span>
                  <span className={`w-5 shrink-0 select-none text-center font-bold ${MARKER_COLOR[line.type]}`}>
                    {MARKER[line.type]}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all px-2 py-0.5 text-zinc-800 dark:text-zinc-200">
                    {line.value === '' ? ' ' : line.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-zinc-100 overflow-auto dark:divide-zinc-800">
              {[0, 1].map((side) => (
                <div key={side}>
                  {sideBySideRows.map((row, i) => {
                    const cell = side === 0 ? row.left : row.right
                    return (
                      <div
                        key={i}
                        className={`flex font-mono text-xs leading-relaxed ${cell ? ROW_STYLES[cell.type] : 'bg-zinc-50 dark:bg-zinc-900/30'}`}
                      >
                        <span className="w-10 shrink-0 select-none border-r border-zinc-100 px-2 text-right text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
                          {cell?.lineNumber ?? ''}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all px-2 py-0.5 text-zinc-800 dark:text-zinc-200">
                          {cell ? cell.value || ' ' : ' '}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DeveloperAdSlot variant="banner" />
    </div>
  )
}
