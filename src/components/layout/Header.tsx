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
      className="flex items-center justify-between border-b px-6"
      style={{ height: 56, background: '#0D0D14', borderColor: '#1E1E2E' }}
    >
      <h1 className="text-base font-semibold" style={{ color: '#F1F5F9' }}>
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs" style={{ color: '#94A3B8' }}>
            Total Portfolio
          </p>
          <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            {formattedTotal}
          </p>
        </div>

        <select
          value={displayCurrency}
          onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          style={{
            background: '#12121A',
            borderColor: '#1E1E2E',
            color: '#F1F5F9',
          }}
        >
          {currencyOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
