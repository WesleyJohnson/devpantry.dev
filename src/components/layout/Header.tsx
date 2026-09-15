import { Link } from 'react-router-dom'
import { PackageOpen, Search, Moon, Sun, PanelLeft } from 'lucide-react'
import { ClientSideBadge } from '@/components/ClientSideBadge'

interface HeaderProps {
  isDark: boolean
  onToggleDark: () => void
  onOpenSearch: () => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function Header({
  isDark,
  onToggleDark,
  onOpenSearch,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
      >
        <PanelLeft className="h-4.5 w-4.5" />
      </button>

      <Link to="/" className="flex items-center gap-2">
        <PackageOpen className="h-5 w-5 text-emerald-500" strokeWidth={1.75} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          DevPantry<span className="text-emerald-500">.dev</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={onOpenSearch}
        className="ml-2 flex w-full max-w-sm items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search tools...</span>
        <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <ClientSideBadge />
        <button
          type="button"
          onClick={onToggleDark}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
      </div>
    </header>
  )
}
