import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
}

// Pure CSS (group-hover), not a portal/positioning library: appears
// instantly on hover instead of the browser's ~1.5s native title delay, and
// looks like the rest of the app instead of the OS tooltip style. Trades
// away collision detection near viewport edges for zero new dependencies —
// fine for short labels on small inline tokens like these.
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="group relative inline-block">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[240px] -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-center text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {content}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
      </span>
    </span>
  )
}
