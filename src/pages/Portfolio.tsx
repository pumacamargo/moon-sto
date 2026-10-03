import { useState } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { useCurrency } from '../contexts/CurrencyContext'
import { formatCurrency, convert } from '../lib/currency'
import { mockPositions, mockAccounts, mockExchangeRates } from '../lib/mockData'
import type { Currency } from '../types'

export default function Portfolio() {
  const { displayCurrency, convert: convertDisplay } = useCurrency()
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const accountOptions = [
    { value: 'all', label: 'All Accounts' },
    ...mockAccounts.map((a) => ({ value: a.id, label: a.name })),
  ]
  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Mexico', label: 'Mexico' },
    { value: 'Japan', label: 'Japan' },
  ]
  const categories = [...new Set(mockPositions.map((p) => p.category))]
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  const filtered = mockPositions.filter((p) => {
    const account = mockAccounts.find((a) => a.id === p.accountId)
    if (filterAccount !== 'all' && p.accountId !== filterAccount) return false
    if (filterLocation !== 'all' && account?.location !== filterLocation) return false
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    return true
  })

  const grouped = mockAccounts
    .map((acc) => {
      const positions = filtered.filter((p) => p.accountId === acc.id)
      return { account: acc, positions }
    })
    .filter((g) => g.positions.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select options={accountOptions} value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} />
        <Select options={locationOptions} value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} />
        <Select options={categoryOptions} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} />
      </div>

      {grouped.map(({ account, positions }) => {
        const subtotalOriginal = positions.reduce((s, p) => s + p.currentValue, 0)
        const subtotalDisplay = positions.reduce(
          (s, p) => s + convertDisplay(p.currentValue, p.currency),
          0
        )
        const subtotalCost = positions.reduce(
          (s, p) => s + convertDisplay(p.value, p.currency),
          0
        )
        const subtotalDiff = subtotalDisplay - subtotalCost

        return (
          <Card key={account.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                  {account.name}
                </h3>
                <Badge variant="neutral">{account.location}</Badge>
                <Badge variant="accent">{account.currency}</Badge>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#94A3B8' }}>Subtotal</p>
                <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                  {formatCurrency(subtotalDisplay, displayCurrency)}
                </p>
              </div>
            </div>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Ticker</th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Category</th>
                      <th className="px-3 py-2 text-right text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Original Value</th>
                      <th className="px-3 py-2 text-right text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Current ({account.currency})</th>
                      <th className="px-3 py-2 text-right text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Value ({displayCurrency})</th>
                      <th className="px-3 py-2 text-right text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>Diff ({displayCurrency})</th>
                      <th className="px-3 py-2 text-right text-xs uppercase tracking-wide" style={{ color: '#94A3B8' }}>% Gain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => {
                      const displayValue = convertDisplay(pos.currentValue, pos.currency)
                      const displayCost = convertDisplay(pos.value, pos.currency)
                      const diff = displayValue - displayCost
                      return (
                        <tr key={pos.id} style={{ borderBottom: '1px solid #1E1E2E' }}>
                          <td className="px-3 py-2.5 font-medium" style={{ color: '#F1F5F9' }}>{pos.ticker}</td>
                          <td className="px-3 py-2.5" style={{ color: '#94A3B8' }}>{pos.category}</td>
                          <td className="px-3 py-2.5 text-right" style={{ color: '#94A3B8' }}>
                            {formatCurrency(pos.value, pos.currency)}
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: '#F1F5F9' }}>
                            {formatCurrency(pos.currentValue, pos.currency as Currency)}
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: '#F1F5F9' }}>
                            {formatCurrency(displayValue, displayCurrency)}
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: diff >= 0 ? '#10B981' : '#EF4444' }}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff, displayCurrency)}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span
                              className="text-xs font-medium"
                              style={{ color: pos.pctGain >= 0 ? '#10B981' : '#EF4444' }}
                            >
                              {pos.pctGain >= 0 ? '+' : ''}{pos.pctGain.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
                      <td colSpan={4} className="px-3 py-2.5 text-xs font-medium" style={{ color: '#94A3B8' }}>
                        Subtotal
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                        {formatCurrency(subtotalDisplay, displayCurrency)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold" style={{ color: subtotalDiff >= 0 ? '#10B981' : '#EF4444' }}>
                        {subtotalDiff >= 0 ? '+' : ''}{formatCurrency(subtotalDiff, displayCurrency)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
