import { NavLink } from 'react-router-dom'
import { Moon, UserRound } from 'lucide-react'
import { clsx } from 'clsx'
import { useCurrency } from '../../contexts/CurrencyContext'
import { formatCurrency } from '../../lib/currency'
import { TOTAL_CAD } from '../../lib/portfolioData'
import type { Currency } from '../../types'

const currencyOptions: Currency[] = ['CAD', 'MXN', 'JPY']

interface HeaderProps {
  title: string
}

/**
 * Mobile: compact sticky bar — logo mark + page title, currency selector, user/settings button.
 * Desktop (md+): page title on the left, portfolio total + currency selector on the right
 * (navigation lives in the sidebar).
 */
export function Header({ title }: HeaderProps) {
  const { displayCurrency, setDisplayCurrency, convert } = useCurrency()

  const formattedTotal = formatCurrency(convert(TOTAL_CAD, 'CAD'), displayCurrency)

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        background: 'rgba(13,13,20,0.92)',
        borderColor: '#1E1E2E',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="flex h-14 items-center justify-between gap-2 px-3 md:h-16 md:px-6">
        {/* Title */}
        <div className="flex min-w-0 items-center gap-2">
          <Moon size={18} fill="#6366F1" color="#6366F1" className="shrink-0 md:hidden" aria-hidden />
          <h1 className="truncate text-lg font-semibold md:text-xl" style={{ color: '#F1F5F9' }}>
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-4">
          {/* Portfolio total — tablet/desktop only, mobile shows it in-page */}
          <div className="hidden text-right sm:block">
            <p className="text-[11px] uppercase tracking-wide" style={{ color: '#94A3B8' }}>Total</p>
            <p className="text-sm font-semibold tabular-nums" style={{ color: '#F1F5F9' }}>{formattedTotal}</p>
          </div>

          {/* Currency selector — 44px touch target on mobile */}
          <label className="sr-only" htmlFor="display-currency">Display currency</label>
          <select
            id="display-currency"
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            className="h-11 rounded-lg border px-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 md:h-9"
            style={{ background: '#12121A', borderColor: '#1E1E2E', color: '#F1F5F9' }}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* User / settings — mobile entry point to Settings (desktop uses sidebar) */}
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              clsx(
                'flex h-11 w-11 items-center justify-center rounded-full transition-colors active:bg-white/10 md:hidden',
                isActive ? 'text-indigo-400' : 'text-slate-400'
              )
            }
          >
            {({ isActive }) => (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.15)' : '#12121A',
                  borderColor: isActive ? 'rgba(99,102,241,0.5)' : '#1E1E2E',
                }}
              >
                <UserRound size={17} />
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  )
}
