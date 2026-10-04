import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/portfolio': 'Portfolio',
  '/planned': 'Planned',
  '/transfers': 'Transfers',
  '/performance': 'Performance',
  '/settings': 'Settings',
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Moonsto'

  return (
    <div className="flex min-h-dvh w-full" style={{ background: '#0A0A0F' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 min-w-0 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+76px)] sm:px-4 sm:pt-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
