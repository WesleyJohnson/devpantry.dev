import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { ToolMeta } from '@/lib/tools'

const TAG_STYLES: Record<NonNullable<ToolMeta['tag']>, string> = {
  POPULAR: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400',
  NEW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400',
}

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
    >
      {tool.tag && (
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_STYLES[tool.tag]}`}
        >
          {tool.tag}
        </span>
      )}
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {tool.title}
          <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 opacity-0 transition group-hover:opacity-100" />
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {tool.description}
        </p>
      </div>
      <span className="mt-auto text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
        {tool.category}
      </span>
    </Link>
  )
}
