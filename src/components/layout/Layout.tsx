import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/portfolio': 'Portfolio',
  '/planned': 'Planned Portfolio',
  '/transfers': 'Transfers',
  '/performance': 'Performance',
  '/settings': 'Settings',
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Moonsto'

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
