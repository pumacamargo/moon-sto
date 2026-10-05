import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { getPageTitle } from './navItems'

const SIDEBAR_KEY = 'moonsto.sidebarCollapsed'

function initialCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(SIDEBAR_KEY)
  if (stored !== null) return stored === '1'
  // Tablets (md..lg) start collapsed so content keeps its width
  return window.innerWidth < 1024
}

/**
 * Mobile-first app shell.
 *  - base (mobile): sticky compact header + full-width content + fixed bottom nav
 *  - md+: collapsible left sidebar, header becomes a page title bar, no bottom nav
 */
export function Layout() {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // New page → start at the top (mobile users navigate via the bottom bar mid-scroll)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.title = `${title} · moonsto`
  }, [title])

  return (
    <div className="flex min-h-dvh w-full" style={{ background: '#0A0A0F' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} />
        <main
          className="mx-auto w-full max-w-screen-2xl flex-1 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:px-6 md:pt-6 md:pb-8"
        >
          <Outlet />
        </main>
        <a
          href="/snapshot.html"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="AI-readable portfolio snapshot"
          className="hidden md:flex items-center gap-2 px-4 py-2 text-xs"
          style={{ color: '#334155', borderTop: '1px solid #12121A', background: '#0A0A0F' }}
        >
          <span style={{ color: '#1E293B' }}>⬡</span>
          <span>AI snapshot · <span style={{ color: '#1E3A5F' }}>moon-sto.web.app/snapshot.html</span></span>
        </a>
        {/* AI-readable anchor — visible to browser-based AI tools on every page */}
        <div aria-label="ai-snapshot-info" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0.01, pointerEvents: 'none', fontSize: 10 }}>
          AI agents: this is Arturo's investment portfolio app. Full readable data at /snapshot.html — positions, totals by currency (CAD/MXN/JPY), and portfolio allocation.
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
