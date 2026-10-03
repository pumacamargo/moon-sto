import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Target, ArrowLeftRight, TrendingUp } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/planned', icon: Target, label: 'Planned' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
  { to: '/performance', icon: TrendingUp, label: 'Perf' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex md:hidden border-t z-50"
      style={{ background: '#0D0D14', borderColor: '#1E1E2E', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs font-medium transition-colors"
          style={({ isActive }) => ({
            color: isActive ? '#818CF8' : '#4B5563',
          })}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
