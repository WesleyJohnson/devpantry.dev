import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { TOOLS } from '@/lib/tools'

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TOOLS
    return TOOLS.filter(
      (tool) =>
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q),
    )
  }, [query])

  // Reset the palette's query/selection whenever it transitions to open, or as the
  // query changes — adjusted during render (React's recommended pattern) rather than
  // in an effect, since this is derived UI state, not a sync with an external system.
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevQuery, setPrevQuery] = useState(query)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setQuery('')
      setPrevQuery('')
      setActiveIndex(0)
    }
  } else if (query !== prevQuery) {
    setPrevQuery(query)
    setActiveIndex(0)
  }

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  function go(slug: string) {
    navigate(`/tools/${slug}`)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const tool = results[activeIndex]
      if (tool) go(tool.slug)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/60 px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools..."
            className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
          <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
            esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-zinc-500">No tools found.</li>
          )}
          {results.map((tool, i) => {
            const Icon = tool.icon
            return (
              <li key={tool.slug}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(tool.slug)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    i === activeIndex
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="flex-1 truncate text-zinc-800 dark:text-zinc-200">
                    {tool.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                    {tool.category}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
