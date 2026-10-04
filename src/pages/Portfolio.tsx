import { Fragment, useState, useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { useCurrency } from '../contexts/CurrencyContext'
import { mockPositions, mockAccounts } from '../lib/mockData'
import { formatCurrency, formatPct } from '../lib/currency'
import { useCetesDirecto } from '../hooks/useCetesDirecto'
import type { Position } from '../types'

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '8px 10px',
  color: '#94A3B8',
  fontWeight: 500,
  borderBottom: '1px solid #1E1E2E',
  whiteSpace: 'nowrap',
  fontSize: 12,
}

const tdStyle: React.CSSProperties = {
  padding: '9px 10px',
  fontSize: 13,
  textAlign: 'right',
  borderBottom: '1px solid #0D0D14',
}

// IDs of mock positions that get replaced by real CETESdirecto data
const CETES_MOCK_IDS = new Set(['11', '14'])

export default function Portfolio() {
  const { convert, formatDisplay, displayCurrency } = useCurrency()
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const cetesData = useCetesDirecto()

  // Build real positions from CETESdirecto captures
  const cetesPositions = useMemo<Position[]>(() => {
    const positions: Position[] = []
    const now = cetesData.bonddia?.capturedAt ?? cetesData.cetes?.capturedAt ?? new Date()

    if (cetesData.bonddia) {
      const b = cetesData.bonddia
      positions.push({
        id: 'cetes-bonddia',
        accountId: '4',
        ticker: 'BONDDIA',
        name: 'Bonddia',
        category: 'Bonddia',
        value: b.montoInvertido,
        currentValue: b.montoValuado,
        currency: 'MXN',
        pctGain: b.montoInvertido > 0 ? ((b.montoValuado - b.montoInvertido) / b.montoInvertido) * 100 : 0,
        lastUpdated: now,
      })
    }

    if (cetesData.cetes) {
      cetesData.cetes.posiciones.forEach(pos => {
        positions.push({
          id: `cetes-${pos.serie}`,
          accountId: '6',
          ticker: 'CETES',
          name: `CETES ${pos.serie}`,
          category: 'Cetes',
          subCategory: `${pos.plazo} · ${pos.tasaCompra}%`,
          value: pos.montoInvertido,
          currentValue: pos.montoValuado,
          currency: 'MXN',
          pctGain: pos.montoInvertido > 0 ? ((pos.montoValuado - pos.montoInvertido) / pos.montoInvertido) * 100 : 0,
          lastUpdated: now,
        })
      })
    }

    return positions
  }, [cetesData])

  // Merge: remove mock CETES/BONDDIA entries, inject real ones
  const allPositions = useMemo<Position[]>(() => {
    const hasCetesReal = cetesPositions.length > 0
    const base = hasCetesReal
      ? mockPositions.filter(p => !CETES_MOCK_IDS.has(p.id))
      : mockPositions
    return [...base, ...cetesPositions]
  }, [cetesPositions])

  const categories = Array.from(new Set(allPositions.map(p => p.category))).sort()

  const filtered = allPositions.filter(p => {
    if (filterAccount !== 'all' && p.accountId !== filterAccount) return false
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    return true
  })

  const byAccount = mockAccounts.map(acc => ({
    account: acc,
    positions: filtered.filter(p => p.accountId === acc.id),
  })).filter(g => g.positions.length > 0)

  const grandTotalDisplay = filtered.reduce((s, p) => s + convert(p.currentValue, p.currency), 0)
  const grandTotalCost = filtered.reduce((s, p) => s + p.value, 0)
  const grandTotalCostDisplay = filtered.reduce((s, p) => s + convert(p.value, p.currency), 0)

  const showStaleWarning = !cetesData.loading && cetesData.isStale

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {showStaleWarning && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: '#F59E0B',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠</span>
          <span>
            CETESdirecto{cetesData.lastUpdated
              ? ` — última captura: ${cetesData.lastUpdated.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : ' — sin capturas'}
            . Abre la extensión en CETESdirecto y captura BONDDIA y CETES para actualizar.
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
        <select
          value={filterAccount}
          onChange={e => setFilterAccount(e.target.value)}
          className="w-full min-w-0 sm:w-auto"
          style={{ background: '#12121A', border: '1px solid #1E1E2E', color: '#F1F5F9', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
        >
          <option value="all">All Accounts</option>
          {mockAccounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="w-full min-w-0 sm:w-auto"
          style={{ background: '#12121A', border: '1px solid #1E1E2E', color: '#F1F5F9', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden" style={{ padding: 0 }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0D0D14' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Account</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Ticker</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Category</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>SubCat</th>
                <th style={thStyle}>Cost</th>
                <th style={thStyle}>Current (orig)</th>
                <th style={thStyle}>Cost ({displayCurrency})</th>
                <th style={thStyle}>Current ({displayCurrency})</th>
                <th style={thStyle}>Diff ({displayCurrency})</th>
                <th style={thStyle}>% Gain</th>
              </tr>
            </thead>
            <tbody>
              {byAccount.map(({ account, positions }) => {
                const accTotal = positions.reduce((s, p) => s + convert(p.currentValue, p.currency), 0)
                const accCost = positions.reduce((s, p) => s + convert(p.value, p.currency), 0)
                return (
                  <Fragment key={account.id}>
                    <tr key={`hdr-${account.id}`} style={{ background: 'rgba(99,102,241,0.05)' }}>
                      <td colSpan={10} style={{ padding: '8px 10px', color: '#818CF8', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {account.name} — {account.location} ({account.currency})
                      </td>
                    </tr>
                    {positions.map(p => {
                      const currentDisplay = convert(p.currentValue, p.currency)
                      const costDisplay = convert(p.value, p.currency)
                      const diffDisplay = currentDisplay - costDisplay
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #0D0D14' }}>
                          <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{account.name}</td>
                          <td style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9', fontWeight: 600 }}>{p.ticker}</td>
                          <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{p.category}</td>
                          <td style={{ ...tdStyle, textAlign: 'left', color: '#4B5563' }}>{p.subCategory ?? '—'}</td>
                          <td style={tdStyle}>{formatCurrency(p.value, p.currency)}</td>
                          <td style={tdStyle}>{formatCurrency(p.currentValue, p.currency)}</td>
                          <td style={tdStyle}>{formatDisplay(costDisplay)}</td>
                          <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(currentDisplay)}</td>
                          <td style={{ ...tdStyle, color: diffDisplay >= 0 ? '#10B981' : '#EF4444' }}>
                            {diffDisplay >= 0 ? '+' : ''}{formatDisplay(diffDisplay)}
                          </td>
                          <td style={{ ...tdStyle, color: p.pctGain >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                            {formatPct(p.pctGain)}
                          </td>
                        </tr>
                      )
                    })}
                    <tr key={`sub-${account.id}`} style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <td colSpan={6} style={{ padding: '8px 10px', color: '#94A3B8', fontSize: 12, textAlign: 'right', fontStyle: 'italic' }}>
                        Subtotal {account.name}
                      </td>
                      <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(accCost)}</td>
                      <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(accTotal)}</td>
                      <td style={{ ...tdStyle, color: (accTotal - accCost) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {(accTotal - accCost) >= 0 ? '+' : ''}{formatDisplay(accTotal - accCost)}
                      </td>
                      <td style={tdStyle} />
                    </tr>
                  </Fragment>
                )
              })}
              <tr style={{ borderTop: '2px solid #1E1E2E', background: '#0D0D14' }}>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9', fontWeight: 700 }}>Total</td>
                <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 600 }}>
                  {formatDisplay(grandTotalCost)}
                </td>
                <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 600 }}>—</td>
                <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 700 }}>{formatDisplay(grandTotalCostDisplay)}</td>
                <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 700 }}>{formatDisplay(grandTotalDisplay)}</td>
                <td style={{ ...tdStyle, color: (grandTotalDisplay - grandTotalCostDisplay) >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                  {(grandTotalDisplay - grandTotalCostDisplay) >= 0 ? '+' : ''}{formatDisplay(grandTotalDisplay - grandTotalCostDisplay)}
                </td>
                <td style={tdStyle} />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
