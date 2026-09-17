import { Heart } from 'lucide-react'
import clsx from 'clsx'

interface DeveloperAdSlotProps {
  variant?: 'sidebar' | 'banner'
  className?: string
}

/**
 * Drop-in placeholder for Carbon Ads / EthicalAds.
 * Swap the fallback below for the network's real embed script/div
 * (e.g. `<div id="carbonads" />` for Carbon Ads) once an account is approved.
 */
const SPONSOR_MAILTO = 'mailto:sponsor@devpantry.dev?subject=Sponsoring%20DevPantry'

export function DeveloperAdSlot({ variant = 'sidebar', className }: DeveloperAdSlotProps) {
  if (variant === 'banner') {
    return (
      <a
        href={SPONSOR_MAILTO}
        className={clsx(
          'flex items-center justify-between gap-3 rounded-lg border border-dashed border-zinc-300 px-4 py-2.5 text-xs text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-emerald-500 dark:hover:text-emerald-400',
          className,
        )}
      >
        <span className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          Sponsor DevPantry — reach developers where they debug.
        </span>
        <span className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-400 dark:border-zinc-700 dark:text-zinc-600">
          ad
        </span>
      </a>
    )
  }

  return (
    <a
      href={SPONSOR_MAILTO}
      className={clsx(
        'flex h-[100px] w-full max-w-[130px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 p-2 text-center text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-emerald-500 dark:hover:text-emerald-400',
        className,
      )}
    >
      <span className="text-[11px] font-medium leading-tight">Sponsor DevPantry</span>
      <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
        carbon-neutral ad
      </span>
    </a>
  )
}
