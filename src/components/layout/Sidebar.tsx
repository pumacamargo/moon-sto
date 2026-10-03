import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Target, ArrowLeftRight, TrendingUp, Settings, Moon } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/planned', icon: Target, label: 'Planned' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
  { to: '/performance', icon: TrendingUp, label: 'Performance' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className="flex flex-col border-r transition-all duration-300"
      style={{
        width: collapsed ? 64 : 220,
        background: '#0D0D14',
        borderColor: '#1E1E2E',
        minHeight: '100vh',
      }}
    >
      <div
        className="flex items-center border-b px-4"
        style={{ height: 56, borderColor: '#1E1E2E' }}
      >
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          style={{ color: '#6366F1' }}
        >
          <Moon size={20} fill="currentColor" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide" style={{ color: '#F1F5F9' }}>
              Moonsto
            </span>
          )}
        </button>
      </div>

      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-indigo-400'
                  : 'hover:bg-white/5'
              )
            }
            style={({ isActive }) => ({
              color: isActive ? '#818CF8' : '#94A3B8',
              background: isActive ? 'rgba(99,102,241,0.1)' : undefined,
            })}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
