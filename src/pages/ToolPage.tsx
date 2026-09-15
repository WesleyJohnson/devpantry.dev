import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft, Link2, Star } from 'lucide-react'
import { getToolBySlug } from '@/lib/tools'
import { useFavorites } from '@/lib/useFavorites'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'

export function ToolPage() {
  const { slug } = useParams<{ slug: string }>()
  const tool = getToolBySlug(slug)
  const { isFavorite, toggleFavorite } = useFavorites()

  if (!tool) return <Navigate to="/" replace />

  const Icon = tool.icon
  const favorited = isFavorite(tool.slug)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <Link
        to="/"
        className="flex w-fit items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All tools
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{tool.title}</h1>
            <p className="mt-0.5 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
              {tool.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(tool.slug)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Star
              className={`h-3.5 w-3.5 ${favorited ? 'fill-amber-400 text-amber-400' : ''}`}
            />
            {favorited ? 'Favorited' : 'Favorite'}
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Link2 className="h-3.5 w-3.5" />
            Copy link
          </button>
        </div>
      </div>

      {tool.component ? (
        <tool.component />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            This tool is coming soon.
          </p>
          <p className="max-w-sm text-xs text-zinc-400 dark:text-zinc-600">
            {tool.title} is on the roadmap — check back shortly, or favorite it to keep track.
          </p>
          <DeveloperAdSlot variant="banner" className="mt-2 w-full max-w-md" />
        </div>
      )}
    </div>
  )
}
