import { useState } from 'react'

export function ClientSideBadge() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 sm:flex"
      >
        🔒 100% Client-Side
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-3 text-xs leading-relaxed text-zinc-600 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          Every tool runs entirely in your browser. Your input never touches a server —
          nothing is logged, stored, or transmitted.
        </div>
      )}
    </div>
  )
}
