import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { CATEGORIES, TOOLS, getToolsByCategory } from '@/lib/tools'
import { ToolCard } from '@/components/ToolCard'

export function Home() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return TOOLS.filter(
      (tool) =>
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-3 pt-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Everyday staple utilities for software engineers.
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Formatters, converters, and LLM helpers that run entirely in your browser. No sign-up,
          no server round-trip, no data leaves your machine.
        </p>

        <div className="mx-auto mt-2 flex w-full max-w-md items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools by name, category, or task..."
            className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
        </div>
      </section>

      {filtered ? (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ) : (
        CATEGORIES.map((category) => (
          <section key={category}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getToolsByCategory(category).map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
