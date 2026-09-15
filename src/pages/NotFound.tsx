import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">404</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        That page doesn't exist in the pantry.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Back to tools
      </Link>
    </div>
  )
}
