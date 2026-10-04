import { NavLink } from 'react-router-dom'
import { Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { clsx } from 'clsx'
import { navItems } from './navItems'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

/** Desktop/tablet navigation (md+). Not rendered visually on mobile — BottomNav takes over. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      aria-label="Primary"
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-300 md:flex"
      style={{
        width: collapsed ? 72 : 224,
        background: '#0D0D14',
        borderColor: '#1E1E2E',
      }}
    >
      <div
        className={clsx('flex h-16 items-center border-b', collapsed ? 'justify-center' : 'px-5')}
        style={{ borderColor: '#1E1E2E' }}
      >
        <div className="flex items-center gap-2.5" style={{ color: '#6366F1' }}>
          <Moon size={20} fill="currentColor" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide" style={{ color: '#F1F5F9' }}>
              Moonsto
            </span>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex h-11 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150',
                collapsed ? 'justify-center' : 'px-3',
                isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3" style={{ borderColor: '#1E1E2E' }}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={clsx(
            'flex h-11 w-full items-center gap-3 rounded-lg text-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300',
            collapsed ? 'justify-center' : 'px-3'
          )}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
