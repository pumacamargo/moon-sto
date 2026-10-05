import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { useCurrency } from '../contexts/CurrencyContext'
import { accounts } from '../lib/portfolioData'
import { formatCurrency, formatPct } from '../lib/currency'
import { useAllPositions } from '../hooks/useAllPositions'

type SortKey = 'pctGain' | 'currentValue' | 'gainLoss'
type SortDir = 'asc' | 'desc'

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  color: '#94A3B8',
  fontWeight: 500,
  borderBottom: '1px solid #1E1E2E',
  whiteSpace: 'nowrap',
  fontSize: 12,
  textAlign: 'right',
  cursor: 'pointer',
}

const tdStyle: React.CSSProperties = {
  padding: '9px 10px',
  fontSize: 13,
  textAlign: 'right',
  borderBottom: '1px solid #0D0D14',
}

export function Performance() {
  const { convert, formatDisplay, displayCurrency } = useCurrency()
  const [sortKey, setSortKey] = useState<SortKey>('pctGain')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const { positions: allPositions, loading } = useAllPositions()

  const accountById = Object.fromEntries(accounts.map(a => [a.id, a]))

  // Only positions with a cost basis (excludes pure cash placeholders with value=0)
  const withGain = allPositions.filter(p => p.value > 0)

  const sorted = [...withGain].sort((a, b) => {
    let av = 0, bv = 0
    if (sortKey === 'pctGain') { av = a.pctGain; bv = b.pctGain }
    else if (sortKey === 'currentValue') {
      av = convert(a.currentValue, a.currency)
      bv = convert(b.currentValue, b.currency)
    } else {
      av = convert(a.currentValue - a.value, a.currency)
      bv = convert(b.currentValue - b.value, b.currency)
    }
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const byPct = [...withGain].sort((a, b) => b.pctGain - a.pctGain)
  const topTwo    = new Set(byPct.slice(0, 2).map(p => p.id))
  const bottomTwo = new Set(byPct.slice(-2).map(p => p.id))

  const totalCost    = withGain.reduce((s, p) => s + convert(p.value, p.currency), 0)
  const totalCurrent = withGain.reduce((s, p) => s + convert(p.currentValue, p.currency), 0)
  const totalGain    = totalCurrent - totalCost
  const best  = byPct[0]
  const worst = byPct[byPct.length - 1]

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Best Performer"
          value={loading ? '…' : (best?.ticker ?? '—')}
          sub={!loading && best ? formatPct(best.pctGain) : ''}
          trend={best?.pctGain}
          highlight
        />
        <StatCard
          label="Worst Performer"
          value={loading ? '…' : (worst?.ticker ?? '—')}
          sub={!loading && worst ? formatPct(worst.pctGain) : ''}
          trend={worst?.pctGain}
          highlight
        />
        <StatCard
          label={`Unrealized Gain (${displayCurrency})`}
          value={loading ? '…' : formatDisplay(totalGain)}
          trend={totalGain}
        />
        <StatCard
          label={`Total Cost (${displayCurrency})`}
          value={loading ? '…' : formatDisplay(totalCost)}
        />
      </div>

      {/* Positions table */}
      <Card className="overflow-hidden" style={{ padding: 0 }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0D0D14' }}>
                <th style={{ ...thStyle, textAlign: 'left', cursor: 'default' }}>Ticker</th>
                <th style={{ ...thStyle, textAlign: 'left', cursor: 'default' }}>Account</th>
                <th style={{ ...thStyle, textAlign: 'left', cursor: 'default' }}>Category</th>
                <th style={{ ...thStyle, cursor: 'default' }}>Cost (orig)</th>
                <th style={{ ...thStyle, cursor: 'default' }}>Current (orig)</th>
                <th style={thStyle} onClick={() => handleSort('currentValue')}>
                  Current ({displayCurrency}) {sortKey === 'currentValue' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th style={thStyle} onClick={() => handleSort('gainLoss')}>
                  Gain ({displayCurrency}) {sortKey === 'gainLoss' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th style={thStyle} onClick={() => handleSort('pctGain')}>
                  % Gain {sortKey === 'pctGain' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th style={{ ...thStyle, cursor: 'default' }}>Label</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#94A3B8', padding: '24px 10px' }}>
                    Loading…
                  </td>
                </tr>
              ) : sorted.map(p => {
                const account      = accountById[p.accountId]
                const currentDisplay = convert(p.currentValue, p.currency)
                const gainDisplay    = convert(p.currentValue - p.value, p.currency)
                const isTop    = topTwo.has(p.id)
                const isBottom = bottomTwo.has(p.id)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #0D0D14' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9', fontWeight: 600 }}>{p.ticker}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{account?.name ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{p.category}</td>
                    <td style={{ ...tdStyle, color: '#94A3B8' }}>{formatCurrency(p.value, p.currency)}</td>
                    <td style={{ ...tdStyle, color: '#94A3B8' }}>{formatCurrency(p.currentValue, p.currency)}</td>
                    <td style={{ ...tdStyle, color: '#F1F5F9' }}>{formatDisplay(currentDisplay)}</td>
                    <td style={{ ...tdStyle, color: gainDisplay >= 0 ? '#10B981' : '#EF4444' }}>
                      {gainDisplay >= 0 ? '+' : ''}{formatDisplay(gainDisplay)}
                    </td>
                    <td style={{ ...tdStyle, color: p.pctGain >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                      {formatPct(p.pctGain)}
                    </td>
                    <td style={{ ...tdStyle }}>
                      {isTop    && <Badge variant="gain">Top</Badge>}
                      {isBottom && !isTop && <Badge variant="loss">Underperformer</Badge>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
