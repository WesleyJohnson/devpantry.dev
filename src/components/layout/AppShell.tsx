import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import { useDarkMode } from '@/lib/useDarkMode'

const MOBILE_QUERY = '(max-width: 767px)'

export function AppShell() {
  const { isDark, toggle } = useDarkMode()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : !window.matchMedia(MOBILE_QUERY).matches,
  )
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (e.key === 'Escape' && window.matchMedia(MOBILE_QUERY).matches) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close the drawer after navigating on mobile; leave the persistent desktop sidebar alone.
  useEffect(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    const isMobileOverlay = sidebarOpen && window.matchMedia(MOBILE_QUERY).matches
    document.body.classList.toggle('overflow-hidden', isMobileOverlay)
    return () => document.body.classList.remove('overflow-hidden')
  }, [sidebarOpen])

  return (
    <div className="flex h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header
        isDark={isDark}
        onToggleDark={toggle}
        onOpenSearch={() => setPaletteOpen(true)}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
