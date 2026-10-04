import { NavLink } from 'react-router-dom'
import { Moon, Settings } from 'lucide-react'
import { useCurrency } from '../../contexts/CurrencyContext'
import { formatCurrency } from '../../lib/currency'
import { TOTAL_CAD } from '../../lib/mockData'
import type { Currency } from '../../types'

const currencyOptions: Currency[] = ['CAD', 'MXN', 'JPY']

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { displayCurrency, setDisplayCurrency, convert } = useCurrency()

  const totalDisplay = convert(TOTAL_CAD, 'CAD')
  const formattedTotal = formatCurrency(totalDisplay, displayCurrency)

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b px-3 sm:px-4 md:px-6"
      style={{ height: 56, background: '#0D0D14', borderColor: '#1E1E2E' }}
    >
      {/* Mobile: logo. Desktop: page title */}
      <div className="flex min-w-0 items-center gap-2">
        <Moon size={18} fill="#6366F1" color="#6366F1" className="md:hidden" />
        <span className="text-sm font-bold tracking-wide md:hidden" style={{ color: '#6366F1' }}>
          moonsto
        </span>
        <h1 className="hidden md:block text-base font-semibold" style={{ color: '#F1F5F9' }}>
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Total portfolio — hidden on very small screens */}
        <div className="text-right hidden sm:block">
          <p className="text-xs" style={{ color: '#94A3B8' }}>Total</p>
          <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{formattedTotal}</p>
        </div>

        {/* Currency selector */}
        <select
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
          className="rounded-lg border px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          style={{ background: '#12121A', borderColor: '#1E1E2E', color: '#F1F5F9' }}
        >
          {currencyOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Settings — mobile only (desktop uses sidebar) */}
        <NavLink
          to="/settings"
          className="md:hidden flex items-center justify-center rounded-lg w-9 h-9 transition-colors hover:bg-white/5"
          style={({ isActive }) => ({ color: isActive ? '#818CF8' : '#94A3B8' })}
        >
          <Settings size={18} />
        </NavLink>
      </div>
    </header>
  )
}
