import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { FolderGit2, Heart } from 'lucide-react'
import { CATEGORIES, getToolsByCategory } from '@/lib/tools'
import { DeveloperAdSlot } from '@/components/DeveloperAdSlot'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop: mobile-only, dims the page behind the drawer and closes it on tap. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        role="navigation"
        aria-label="Tool categories"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 -translate-x-full flex-col border-r border-zinc-200 bg-zinc-50 transition-transform duration-200 ease-in-out dark:border-zinc-800 dark:bg-zinc-950',
          'md:static md:z-auto md:translate-x-0 md:bg-zinc-50/50 md:transition-none',
          open ? 'translate-x-0' : '-translate-x-full',
          !open && 'md:hidden',
        )}
      >
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {CATEGORIES.map((category) => (
            <div key={category} className="mb-5">
              <h2 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                {category}
              </h2>
              <ul className="space-y-0.5">
                {getToolsByCategory(category).map((tool) => (
                  <li key={tool.slug}>
                    <NavLink
                      to={`/tools/${tool.slug}`}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition',
                          isActive
                            ? 'bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900',
                        )
                      }
                    >
                      <tool.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{tool.title}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <DeveloperAdSlot variant="sidebar" className="mx-auto" />
        </div>
        <div className="flex flex-col items-center gap-2 border-t border-zinc-200 px-3 py-2.5 text-center text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          <p className="flex items-center justify-center gap-1">
            Built with <Heart className="h-3 w-3 fill-current text-red-400" /> by{' '}
            <a
              href="https://github.com/WesleyJohnson"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              Wes Johnson
            </a>
          </p>
          <iframe
            src="https://github.com/sponsors/WesleyJohnson/button"
            title="Sponsor WesleyJohnson"
            height="32"
            width="114"
            style={{ border: 0, borderRadius: '6px' }}
          ></iframe>
          <a
            href="https://github.com/WesleyJohnson/devpantry.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <FolderGit2 className="h-3 w-3" />
            View source
          </a>
        </div>
      </aside>
    </>
  )
}
