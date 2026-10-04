import { Fragment, useState, useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { useCurrency } from '../contexts/CurrencyContext'
import { mockPositions, mockAccounts } from '../lib/mockData'
import { formatCurrency, formatPct } from '../lib/currency'
import { useCetesDirecto } from '../hooks/useCetesDirecto'
import { useGbm } from '../hooks/useGbm'
import { useRakuten } from '../hooks/useRakuten'
import { useTd } from '../hooks/useTd'
import type { Position } from '../types'

// ─── Donut pie chart ─────────────────────────────────────────────────────────

interface PieSlice { label: string; value: number; color: string }

function PieChart({ slices, title }: { slices: PieSlice[]; title: string }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const cx = 70, cy = 70, R = 56, r = 34
  let angle = -Math.PI / 2
  const paths = slices.map((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI
    const a0 = angle, a1 = angle + sweep
    angle = a1
    const large = sweep > Math.PI ? 1 : 0
    // Full circle: SVG arcs can't span exactly 360°, use two 180° arcs
    const path = sweep >= 2 * Math.PI - 0.001
      ? `M${cx + R},${cy} A${R},${R},0,1,1,${cx - R},${cy} A${R},${R},0,1,1,${cx + R},${cy} M${cx + r},${cy} A${r},${r},0,1,0,${cx - r},${cy} A${r},${r},0,1,0,${cx + r},${cy} Z`
      : `M${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} A${R},${R},0,${large},1,${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R} L${cx + Math.cos(a1) * r},${cy + Math.sin(a1) * r} A${r},${r},0,${large},0,${cx + Math.cos(a0) * r},${cy + Math.sin(a0) * r} Z`
    return { ...d, path, pct: d.value / total, idx: i }
  })

  const active = hovered !== null ? paths[hovered] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ overflow: 'visible' }}>
        {paths.map(p => (
          <path key={p.idx} d={p.path} fill={p.color} stroke="#0D0D14" strokeWidth={2}
            style={{ opacity: hovered === null || hovered === p.idx ? 1 : 0.35, cursor: 'pointer', transition: 'opacity 0.12s' }}
            onMouseEnter={() => setHovered(p.idx)} onMouseLeave={() => setHovered(null)}
            onClick={() => setHovered(h => h === p.idx ? null : p.idx)} />
        ))}
        {active ? (
          <>
            <text x={cx} y={cy - 5} textAnchor="middle" fill="#F1F5F9" fontSize={14} fontWeight={700}>{(active.pct * 100).toFixed(1)}%</text>
            <text x={cx} y={cy + 11} textAnchor="middle" fill="#94A3B8" fontSize={9}>{active.label}</text>
          </>
        ) : null}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
        {paths.map(p => (
          <div key={p.idx} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, minHeight: 24,
            opacity: hovered === null || hovered === p.idx ? 1 : 0.35, cursor: 'pointer', transition: 'opacity 0.12s' }}
            onMouseEnter={() => setHovered(p.idx)} onMouseLeave={() => setHovered(null)}
            onClick={() => setHovered(h => h === p.idx ? null : p.idx)}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            <span style={{ color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
            <span style={{ color: '#F1F5F9', fontWeight: 600, flexShrink: 0 }}>{(p.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

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

// TD account type → mockAccount id mapping
const TD_ACCOUNT_IDS: Record<string, string> = { RRSP: '1', TFSA: '2', Cash: '3' }

// Category and subCategory overrides for known TD tickers
const TD_CATEGORIES: Record<string, string> = {
  KILO: 'Metals & Commodities', SBT: 'Metals & Commodities',
  UEC:  'Metals & Commodities', IAU: 'Metals & Commodities',
  MSFT: 'Productive Assets US', CIBR: 'Productive Assets US',
  QS:   'Productive Assets US', UBI:  'Productive Assets US',
  U:    'Productive Assets US',
}
const TD_SUBCATEGORIES: Record<string, string> = { UBI: 'Lottery', U: 'Lottery' }

export default function Portfolio() {
  const { convert, formatDisplay, displayCurrency } = useCurrency()
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [advanced, setAdvanced] = useState(false)
  const cetesData   = useCetesDirecto()
  const gbmData     = useGbm()
  const rakutenData = useRakuten()
  const tdData      = useTd()

  // Build real positions from CETESdirecto captures
  const cetesPositions = useMemo<Position[]>(() => {
    const positions: Position[] = []
    const now = cetesData.bonddia?.capturedAt ?? cetesData.cetes?.capturedAt ?? new Date()

    if (cetesData.bonddia) {
      const b = cetesData.bonddia
      // BONDDIA reinvests daily — "montoInvertido" equals "montoValuado" (current balance).
      // The real cost basis is montoValuado - plusvalia (gain is shown separately).
      const costBasis = b.montoValuado - b.plusvalia
      positions.push({
        id: 'cetes-bonddia',
        accountId: '4',
        ticker: 'BONDDIA',
        name: 'Bonddia',
        category: 'Bonddia',
        value: costBasis,
        currentValue: b.montoValuado,
        currency: 'MXN',
        pctGain: costBasis > 0 ? (b.plusvalia / costBasis) * 100 : 0,
        lastUpdated: now,
      })
    }

    if (cetesData.cetes) {
      // Derive original CETES cost: total deposits minus BONDDIA original cost.
      // CETES roll over (gains get reinvested), so montoInvertido already includes
      // previous cycles' gains — not the true historical cost basis.
      const bonddiaCost = cetesData.bonddia
        ? cetesData.bonddia.montoValuado - cetesData.bonddia.plusvalia
        : 0
      const cetesOriginalTotal = cetesData.totalDeposited > 0 && bonddiaCost > 0
        ? cetesData.totalDeposited - bonddiaCost
        : 0
      const totalMontoInv = cetesData.cetes.posiciones.reduce((s, p) => s + p.montoInvertido, 0)

      cetesData.cetes.posiciones.forEach(pos => {
        const origCost = cetesOriginalTotal > 0 && totalMontoInv > 0
          ? cetesOriginalTotal * (pos.montoInvertido / totalMontoInv)
          : pos.montoInvertido
        positions.push({
          id: `cetes-${pos.serie}`,
          accountId: '6',
          ticker: 'CETES',
          name: `CETES ${pos.serie}`,
          category: 'Cetes',
          subCategory: `${pos.plazo} · ${pos.tasaCompra}%`,
          value: origCost,
          currentValue: pos.montoValuado,
          currency: 'MXN',
          pctGain: origCost > 0 ? ((pos.montoValuado - origCost) / origCost) * 100 : 0,
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

  // Build real Rakuten positions (stocks + cash)
  const rakutenPositions = useMemo<Position[]>(() => {
    if (!rakutenData.capture) return []
    const now = rakutenData.capture.capturedAt
    const positions: Position[] = rakutenData.capture.posiciones.map(pos => ({
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
    if (rakutenData.capture.cashJpy > 0) {
      positions.push({
        id: 'rakuten-cash', accountId: '7',
        ticker: 'JPY', name: 'Cash',
        category: 'Cash',
        value: rakutenData.capture.cashJpy,
        currentValue: rakutenData.capture.cashJpy,
        currency: 'JPY' as const,
        pctGain: 0,
        lastUpdated: now,
      })
    }
    return positions
  }, [rakutenData])

  // Build real TD positions (stocks + cash per account)
  const tdPositions = useMemo<Position[]>(() => {
    const positions: Position[] = []
    for (const capture of tdData.captures) {
      const accountId = TD_ACCOUNT_IDS[capture.accountType] ?? '1'
      const now = capture.capturedAt
      for (const pos of capture.positions) {
        positions.push({
          id:           `td-${capture.accountId}-${pos.ticker}`,
          accountId,
          ticker:       pos.ticker,
          name:         pos.name,
          category:     TD_CATEGORIES[pos.ticker] ?? 'Productive Assets US',
          subCategory:  TD_SUBCATEGORIES[pos.ticker],
          value:        pos.bookCost,
          currentValue: pos.marketValue,
          currency:     'CAD' as const,
          pctGain:      pos.unrealizedPct,
          lastUpdated:  now,
        })
      }
      if (capture.cashBalance > 0) {
        positions.push({
          id:           `td-${capture.accountId}-cash`,
          accountId,
          ticker:       'CAD',
          name:         'Cash',
          category:     'Cash',
          value:        capture.cashBalance,
          currentValue: capture.cashBalance,
          currency:     'CAD' as const,
          pctGain:      0,
          lastUpdated:  capture.capturedAt,
        })
      }
    }
    return positions
  }, [tdData.captures])

  // Merge: remove mock entries, inject real ones
  const allPositions = useMemo<Position[]>(() => {
    const hasCetes   = cetesPositions.length > 0
    const hasGbm     = gbmPositions.length > 0
    const hasRakuten = rakutenPositions.length > 0
    const hasTd      = tdPositions.length > 0
    const tdAccountIds = new Set(
      tdData.captures.map(c => TD_ACCOUNT_IDS[c.accountType]).filter((id): id is string => !!id)
    )
    return mockPositions
      .filter(p => !(hasTd      && tdAccountIds.has(p.accountId)))
      .filter(p => !(hasCetes   && CETES_MOCK_IDS.has(p.id)))
      .filter(p => !(hasGbm     && GBM_MOCK_IDS.has(p.id)))
      .filter(p => !(hasRakuten && RAKUTEN_MOCK_IDS.has(p.id)))
      .concat(cetesPositions)
      .concat(gbmPositions)
      .concat(rakutenPositions)
      .concat(tdPositions)
  }, [cetesPositions, gbmPositions, rakutenPositions, tdPositions, tdData.captures])

  const categories = Array.from(new Set(allPositions.map(p => p.category))).sort()

  const filtered = allPositions.filter(p => {
    if (p.currentValue === 0 && p.value === 0) return false
    if (filterAccount !== 'all' && p.accountId !== filterAccount) return false
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    return true
  })

  const accountById = Object.fromEntries(mockAccounts.map(a => [a.id, a]))

  const COUNTRY_ORDER = ['Japan', 'Mexico', 'Canada'] as const
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
                           (!rakutenData.loading && rakutenData.isStale) ||
                           (!tdData.loading && tdData.isStale)

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
                  ? ` — last capture: ${cetesData.lastUpdated.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ' — no captures'}
                . Capture BONDDIA and CETES to update.
              </span>
            )}
            {!gbmData.loading && gbmData.isStale && (
              <span>
                GBM{gbmData.lastUpdated
                  ? ` — last capture: ${gbmData.lastUpdated.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ' — no captures'}
                . Capture your GBM account page to update.
              </span>
            )}
            {!rakutenData.loading && rakutenData.isStale && (
              <span>
                Rakuten{rakutenData.lastUpdated
                  ? ` — last capture: ${rakutenData.lastUpdated.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ' — no captures'}
                . Capture 'List of owned items' on Rakuten to update.
              </span>
            )}
            {!tdData.loading && tdData.isStale && (
              <span>
                TD Bank{tdData.lastUpdated
                  ? ` — last capture: ${tdData.lastUpdated.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ' — no captures'}
                . Capture your TD Direct Investing account to update.
              </span>
            )}
          </span>
        </div>
      )}
      {/* Totals summary */}
      {(() => {
        const topCountry = countryTotals.length > 0
          ? (() => { const best = countryTotals.reduce((a, b) => a.diff > b.diff ? a : b); return best.diff > 0 ? best.country : null })()
          : null
        return (
      <div className="grid grid-cols-1 gap-2 md:grid-flow-col md:auto-cols-fr md:gap-3">
        <div className="min-w-0 p-4 md:p-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}>
          <div className="text-xs md:text-[11px]" style={{ color: '#6366F1', marginBottom: 4 }}>Total</div>
          <div className="text-3xl tabular-nums break-words md:text-base" style={{ fontWeight: 700, color: '#F1F5F9' }}>{formatDisplay(grandTotalDisplay)}</div>
          <div className="text-sm tabular-nums md:text-[11px]" style={{ color: grandTotalDiff >= 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
            {grandTotalDiff >= 0 ? '+' : ''}{formatDisplay(grandTotalDiff)}
          </div>
        </div>
        {countryTotals.map(({ country, total, diff }) => {
          const flag = country === 'Canada' ? '🇨🇦' : country === 'Mexico' ? '🇲🇽' : '🇯🇵'
          const isTop = country === topCountry
          return (
            // Mobile: compact full-width row (label left, figures right). md+: stacked card.
            <div key={country} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 md:block md:p-3" style={{
              background: isTop ? 'rgba(251,191,36,0.06)' : '#12121A',
              border: `1px solid ${isTop ? 'rgba(251,191,36,0.4)' : '#1E1E2E'}`,
              borderRadius: 12,
              boxShadow: isTop ? '0 0 16px rgba(251,191,36,0.1)' : 'none',
            }}>
              <div className="flex min-w-0 items-center gap-1.5 text-sm md:mb-1 md:text-[11px]" style={{ color: isTop ? '#F59E0B' : '#64748B' }}>
                <span className="truncate">{flag} {country}</span>
                {isTop && <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.9 }}>👑</span>}
              </div>
              <div className="min-w-0 text-right md:text-left">
                <div className="text-lg tabular-nums break-words md:text-base" style={{ fontWeight: 700, color: '#F1F5F9' }}>{formatDisplay(total)}</div>
                <div className="text-xs tabular-nums md:text-[11px]" style={{ color: diff >= 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
                  {diff >= 0 ? '+' : ''}{formatDisplay(diff)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
        )
      })()}

      {/* ── Pie charts ── */}
      {(() => {
        const COUNTRY_COLORS: Record<string, string> = { Japan: '#818CF8', Mexico: '#34D399', Canada: '#FBBF24' }
        const countrySlices: PieSlice[] = countryTotals.map(c => ({
          label: (c.country === 'Canada' ? '🇨🇦 ' : c.country === 'Mexico' ? '🇲🇽 ' : '🇯🇵 ') + c.country,
          value: c.total,
          color: COUNTRY_COLORS[c.country] ?? '#64748B',
        }))

        const CAT_COLORS = ['#818CF8', '#34D399', '#FB923C', '#F472B6', '#FBBF24', '#64748B']
        const catMap: Record<string, number> = {}
        filtered.forEach(p => { catMap[p.category] = (catMap[p.category] ?? 0) + convert(p.currentValue, p.currency) })
        const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1])
        const top5 = catEntries.slice(0, 5)
        const otherVal = catEntries.slice(5).reduce((s, [, v]) => s + v, 0)
        if (otherVal > 0) top5.push(['Other', otherVal])
        const catSlices: PieSlice[] = top5.map(([label, value], i) => ({ label, value, color: CAT_COLORS[i] ?? '#64748B' }))

        const cashDisplay = filtered.filter(p => p.category === 'Cash').reduce((s, p) => s + convert(p.currentValue, p.currency), 0)
        const investedDisplay = grandTotalDisplay - cashDisplay
        const investedSlices: PieSlice[] = [
          { label: 'Invested', value: investedDisplay, color: '#34D399' },
          ...(cashDisplay > 0.01 ? [{ label: 'Cash', value: cashDisplay, color: '#475569' }] : []),
        ]

        return (
          <div className="scroll-strip -mx-3 flex gap-3 px-3 md:mx-0 md:grid md:grid-cols-3 md:px-0">
            {[
              { slices: countrySlices, title: 'By Country' },
              { slices: catSlices,     title: 'By Category' },
              { slices: investedSlices, title: 'Invested vs Cash' },
            ].map(({ slices, title }) => (
              <div key={title} className="w-[78%] shrink-0 p-4 sm:w-[45%] md:w-auto" style={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: 12 }}>
                <PieChart slices={slices} title={title} />
              </div>
            ))}
          </div>
        )
      })()}

      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:gap-3">
          <select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
            className="min-h-11 w-full min-w-0 px-3 text-sm sm:w-auto md:min-h-9"
            style={{ background: '#12121A', border: '1px solid #1E1E2E', color: '#F1F5F9', borderRadius: 8 }}
          >
            <option value="all">All Accounts</option>
            {mockAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="min-h-11 w-full min-w-0 px-3 text-sm sm:w-auto md:min-h-9"
            style={{ background: '#12121A', border: '1px solid #1E1E2E', color: '#F1F5F9', borderRadius: 8 }}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setAdvanced(a => !a)}
          aria-pressed={advanced}
          className="min-h-11 px-3 text-sm md:min-h-9"
          style={{
            flexShrink: 0,
            background: advanced ? 'rgba(99,102,241,0.12)' : '#12121A',
            border: `1px solid ${advanced ? '#6366F1' : '#1E1E2E'}`,
            color: advanced ? '#818CF8' : '#64748B',
            borderRadius: 8,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {advanced ? 'Advanced' : 'Simple'}
        </button>
      </div>

      <Card className="overflow-hidden" style={{ padding: 0 }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0D0D14' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Account</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Ticker</th>
                {advanced && <th style={{ ...thStyle, textAlign: 'left' }}>Category</th>}
                {advanced && <th style={{ ...thStyle, textAlign: 'left' }}>SubCat</th>}
                {advanced && <th style={thStyle}>Cost</th>}
                {advanced && <th style={thStyle}>Current (orig)</th>}
                {advanced && <th style={thStyle}>Cost ({displayCurrency})</th>}
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
                      <td colSpan={advanced ? 10 : 5} style={{ padding: '8px 10px', color: '#818CF8', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                          <td style={{ ...tdStyle, textAlign: 'left' }}>
                            <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{p.ticker}</span>
                            {p.name && <span style={{ display: 'block', color: '#4B5563', fontSize: 11, fontWeight: 400 }}>{p.name}</span>}
                          </td>
                          {advanced && <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{p.category}</td>}
                          {advanced && <td style={{ ...tdStyle, textAlign: 'left', color: '#4B5563' }}>{p.subCategory ?? '—'}</td>}
                          {advanced && <td style={tdStyle}>{formatCurrency(p.value, p.currency)}</td>}
                          {advanced && <td style={tdStyle}>{formatCurrency(p.currentValue, p.currency)}</td>}
                          {advanced && <td style={tdStyle}>{formatDisplay(costDisplay)}</td>}
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
                      <td colSpan={advanced ? 6 : 2} style={{ padding: '8px 10px', color: '#94A3B8', fontSize: 12, textAlign: 'right', fontStyle: 'italic' }}>
                        Subtotal {country}
                      </td>
                      {advanced && <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(countryCost)}</td>}
                      <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(countryTotal)}</td>
                      <td style={{ ...tdStyle, color: countryDiff >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {countryDiff >= 0 ? '+' : ''}{formatDisplay(countryDiff)}
                      </td>
                      <td style={{ ...tdStyle, color: countryDiff >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {formatPct(countryCost > 0 ? (countryDiff / countryCost) * 100 : 0)}
                      </td>
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
