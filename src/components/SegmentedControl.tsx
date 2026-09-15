interface SegmentedControlProps<T extends string> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  labels?: Partial<Record<T, string>>
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-3 py-1.5 text-xs font-medium transition ${
            value === option
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
        >
          {labels?.[option] ?? option}
        </button>
      ))}
    </div>
  )
}
