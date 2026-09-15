import { useEffect, useState } from 'react'

const STORAGE_KEY = 'devpantry-theme'

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light') return false
  if (stored === 'dark') return true
  return true // dark-first default
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  return { isDark, toggle: () => setIsDark((v) => !v) }
}
