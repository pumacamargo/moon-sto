import { Fragment, useState, useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { useCurrency } from '../contexts/CurrencyContext'
import { mockPositions, mockAccounts } from '../lib/mockData'
import { formatCurrency, formatPct } from '../lib/currency'
import { useCetesDirecto } from '../hooks/useCetesDirecto'
import { useGbm } from '../hooks/useGbm'
import { useRakuten } from '../hooks/useRakuten'
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

const CETES_MOCK_IDS   = new Set(['11', '14'])
const GBM_MOCK_IDS     = new Set(['12', '13'])
const RAKUTEN_MOCK_IDS = new Set(['15', '16', '17'])

export default function Portfolio() {
  const { convert, formatDisplay, displayCurrency } = useCurrency()
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const cetesData = useCetesDirecto()
  const gbmData     = useGbm()
  const rakutenData = useRakuten()

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

  // Build real GBM positions
  const gbmPositions = useMemo<Position[]>(() => {
    if (!gbmData.capture) return []
    const now = gbmData.capture.capturedAt
    return gbmData.capture.posiciones.map(pos => ({
      id:           `gbm-${pos.ticker.replace(/\s/g, '-')}`,
      accountId:    '5',
      ticker:       pos.ticker,
      category:     pos.seccion === 'capitales' ? 'REITs / InfrastructureM' : 'Reporto',
      value:        pos.impXCto,
      currentValue: pos.valorMerc,
      currency:     'MXN' as const,
      pctGain:      pos.varHistPct,
      lastUpdated:  now,
    }))
  }, [gbmData])

  // Build real Rakuten positions
  const rakutenPositions = useMemo<Position[]>(() => {
    if (!rakutenData.capture) return []
    const now = rakutenData.capture.capturedAt
    return rakutenData.capture.posiciones.map(pos => ({
      id:           `rakuten-${pos.tickerCode}`,
      accountId:    '7',
      ticker:       pos.tickerCode,
      name:         pos.name,
      category:     'Productive Assets JP',
      value:        pos.costBasis,
      currentValue: pos.marketValue,
      currency:     'JPY' as const,
      pctGain:      pos.pctGain,
      lastUpdated:  now,
    }))
  }, [rakutenData])

  // Merge: remove mock entries, inject real ones
  const allPositions = useMemo<Position[]>(() => {
    const hasCetes   = cetesPositions.length > 0
    const hasGbm     = gbmPositions.length > 0
    const hasRakuten = rakutenPositions.length > 0
    return mockPositions
      .filter(p => !(hasCetes   && CETES_MOCK_IDS.has(p.id)))
      .filter(p => !(hasGbm     && GBM_MOCK_IDS.has(p.id)))
      .filter(p => !(hasRakuten && RAKUTEN_MOCK_IDS.has(p.id)))
      .concat(cetesPositions)
      .concat(gbmPositions)
      .concat(rakutenPositions)
  }, [cetesPositions, gbmPositions, rakutenPositions])

  const categories = Array.from(new Set(allPositions.map(p => p.category))).sort()

  const filtered = allPositions.filter(p => {
    if (p.currentValue === 0 && p.value === 0) return false
    if (filterAccount !== 'all' && p.accountId !== filterAccount) return false
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    return true
  })

  const accountById = Object.fromEntries(mockAccounts.map(a => [a.id, a]))

  const COUNTRY_ORDER = ['Canada', 'Mexico', 'Japan'] as const
  const byCountry = COUNTRY_ORDER.map(country => ({
    country,
    positions: filtered.filter(p => accountById[p.accountId]?.location === country),
  })).filter(g => g.positions.length > 0)

  const grandTotalDisplay     = filtered.reduce((s, p) => s + convert(p.currentValue, p.currency), 0)
  const grandTotalCostDisplay = filtered.reduce((s, p) => s + convert(p.value, p.currency), 0)
  const grandTotalDiff        = grandTotalDisplay - grandTotalCostDisplay

  const countryTotals = COUNTRY_ORDER.map(country => {
    const positions = filtered.filter(p => accountById[p.accountId]?.location === country)
    const total = positions.reduce((s, p) => s + convert(p.currentValue, p.currency), 0)
    const cost  = positions.reduce((s, p) => s + convert(p.value, p.currency), 0)
    return { country, total, diff: total - cost }
  }).filter(c => c.total > 0)

  const showStaleWarning = (!cetesData.loading && cetesData.isStale) ||
                           (!gbmData.loading && gbmData.isStale) ||
                           (!rakutenData.loading && rakutenData.isStale)

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
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!cetesData.loading && cetesData.isStale && (
              <span>
                CETESdirecto{cetesData.lastUpdated
                  ? ` — última captura: ${cetesData.lastUpdated.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ' — sin capturas'}
                . Captura BONDDIA y CETES para actualizar.
              </span>
            )}
            {!gbmData.loading && gbmData.isStale && (
              <span>
                GBM{gbmData.lastUpdated
                  ? ` — última captura: ${gbmData.lastUpdated.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ' — sin capturas'}
                . Captura la página de tu cuenta en GBM para actualizar.
              </span>
            )}
            {!rakutenData.loading && rakutenData.isStale && (
              <span>
                Rakuten{rakutenData.lastUpdated
                  ? ` — última captura: ${rakutenData.lastUpdated.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ' — sin capturas'}
                . Captura "List of owned items" en Rakuten para actualizar.
              </span>
            )}
          </span>
        </div>
      )}
      {/* Totals summary */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${countryTotals.length + 1}, 1fr)`, gap: 8 }}>
        {countryTotals.map(({ country, total, diff }) => {
          const flag = country === 'Canada' ? '🇨🇦' : country === 'Mexico' ? '🇲🇽' : '🇯🇵'
          return (
            <div key={country} style={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 4 }}>{flag} {country}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>{formatDisplay(total)}</div>
              <div style={{ fontSize: 11, color: diff >= 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
                {diff >= 0 ? '+' : ''}{formatDisplay(diff)}
              </div>
            </div>
          )
        })}
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#6366F1', marginBottom: 4 }}>Total</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>{formatDisplay(grandTotalDisplay)}</div>
          <div style={{ fontSize: 11, color: grandTotalDiff >= 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
            {grandTotalDiff >= 0 ? '+' : ''}{formatDisplay(grandTotalDiff)}
          </div>
        </div>
      </div>

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
              {byCountry.map(({ country, positions }) => {
                const countryTotal = positions.reduce((s, p) => s + convert(p.currentValue, p.currency), 0)
                const countryCost  = positions.reduce((s, p) => s + convert(p.value, p.currency), 0)
                const countryDiff  = countryTotal - countryCost
                const flag = country === 'Canada' ? '🇨🇦' : country === 'Mexico' ? '🇲🇽' : '🇯🇵'
                return (
                  <Fragment key={country}>
                    <tr style={{ background: 'rgba(99,102,241,0.07)' }}>
                      <td colSpan={10} style={{ padding: '8px 10px', color: '#818CF8', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {flag} {country}
                      </td>
                    </tr>
                    {positions.map(p => {
                      const acc = accountById[p.accountId]
                      const currentDisplay = convert(p.currentValue, p.currency)
                      const costDisplay    = convert(p.value, p.currency)
                      const diffDisplay    = currentDisplay - costDisplay
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #0D0D14' }}>
                          <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{acc?.name ?? '—'}</td>
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
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <td colSpan={6} style={{ padding: '8px 10px', color: '#94A3B8', fontSize: 12, textAlign: 'right', fontStyle: 'italic' }}>
                        Subtotal {country}
                      </td>
                      <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(countryCost)}</td>
                      <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(countryTotal)}</td>
                      <td style={{ ...tdStyle, color: countryDiff >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {countryDiff >= 0 ? '+' : ''}{formatDisplay(countryDiff)}
                      </td>
                      <td style={tdStyle} />
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
