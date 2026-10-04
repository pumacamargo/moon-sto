import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { navItems } from './navItems'

/**
 * Mobile primary navigation. Fixed to the bottom, respects the iPhone home
 * indicator via safe-area-inset-bottom. Hidden from md: up (sidebar takes over).
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md md:hidden"
      style={{
        background: 'rgba(13,13,20,0.92)',
        borderColor: '#1E1E2E',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <ul className="flex h-16 items-stretch">
        {navItems.filter((n) => n.inBottomNav).map(({ to, icon: Icon, short }) => (
          <li key={to} className="flex min-w-0 flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'relative flex min-h-11 w-full min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none transition-colors active:bg-white/5',
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator pill */}
                  <span
                    aria-hidden
                    className={clsx(
                      'absolute top-0 h-0.5 w-8 rounded-full transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{ background: '#6366F1' }}
                  />
                  <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className="max-w-full truncate px-1">{short}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
