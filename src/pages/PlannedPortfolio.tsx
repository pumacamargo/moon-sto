import { Fragment, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '../components/ui/Card'
import { useCurrency } from '../contexts/CurrencyContext'
import { mockPlannedGroups, TOTAL_CAD } from '../lib/mockData'
import { formatPct } from '../lib/currency'

const GROUP_BG: Record<string, string> = {
  Productive: 'rgba(99,102,241,0.07)',
  Liquidity: 'rgba(16,185,129,0.07)',
  Protection: 'rgba(245,158,11,0.07)',
}
const GROUP_COLOR: Record<string, string> = {
  Productive: '#818CF8',
  Liquidity: '#34D399',
  Protection: '#FBBF24',
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  color: '#94A3B8',
  fontWeight: 500,
  borderBottom: '1px solid #1E1E2E',
  whiteSpace: 'nowrap',
  fontSize: 12,
  textAlign: 'right',
}

const tdStyle: React.CSSProperties = {
  padding: '9px 10px',
  fontSize: 13,
  textAlign: 'right',
  borderBottom: '1px solid #0D0D14',
}

export function PlannedPortfolio() {
  const { convert, formatDisplay } = useCurrency()
  const [showSuggestions, setShowSuggestions] = useState(false)

  const allCategories = mockPlannedGroups.flatMap(g => g.categories)

  const locationRows = (['Canada', 'Mexico', 'Japan'] as const).map(loc => {
    const cats = allCategories.filter(c => c.location === loc)
    return {
      location: loc,
      targetPct: cats.reduce((s, c) => s + c.targetPct, 0),
      currentPct: cats.reduce((s, c) => s + c.currentPct, 0),
      targetValue: cats.reduce((s, c) => s + c.targetValue, 0),
      currentValue: cats.reduce((s, c) => s + c.currentValue, 0),
      netPnl: cats.reduce((s, c) => s + (c.netPnl ?? 0), 0),
    }
  })

  const suggestions = allCategories
    .filter(c => c.targetPct > 0 || c.currentPct > 0)
    .map(c => {
      const diffVal = c.targetValue - c.currentValue
      return { category: c.category, location: c.location, diffVal }
    })
    .filter(s => Math.abs(s.diffVal) > 1)

  const LOCATION_COLORS: Record<string, string> = {
    Canada: '#818CF8',
    Mexico: '#34D399',
    Japan: '#FBBF24',
  }

  const locationPieData = (['Canada', 'Mexico', 'Japan'] as const)
    .map(loc => ({
      name: loc,
      value: allCategories.filter(c => c.location === loc).reduce((s, c) => s + c.targetPct, 0),
    }))
    .filter(d => d.value > 0)

  const groupPieData = mockPlannedGroups.map(g => ({
    name: g.name,
    value: g.categories.reduce((s, c) => s + c.targetPct, 0),
  }))

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number
  }) => {
    if (!percent || percent < 0.05 || cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null) return null
    const RADIAN = Math.PI / 180
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#F1F5F9" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">

      {/* Pie Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {/* By Country */}
        <Card style={{ padding: 0 }}>
          <div className="px-4 py-3 md:px-5" style={{ borderBottom: '1px solid #1E1E2E' }}>
            <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Target — by Country
            </span>
          </div>
          <div style={{ padding: '16px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={locationPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {locationPieData.map(entry => (
                    <Cell key={entry.name} fill={LOCATION_COLORS[entry.name] ?? '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Target']}
                  contentStyle={{ background: '#1E1E2E', border: '1px solid #2D2D40', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#F1F5F9' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* By Category */}
        <Card style={{ padding: 0 }}>
          <div className="px-4 py-3 md:px-5" style={{ borderBottom: '1px solid #1E1E2E' }}>
            <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Target — by Group
            </span>
          </div>
          <div style={{ padding: '16px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={groupPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {groupPieData.map(entry => (
                    <Cell key={entry.name} fill={GROUP_COLOR[entry.name] ?? '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Target']}
                  contentStyle={{ background: '#1E1E2E', border: '1px solid #2D2D40', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#F1F5F9' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Table 1: by Group + Category */}
      <Card className="overflow-hidden" style={{ padding: 0 }}>
        <div className="px-4 py-3 md:px-5" style={{ borderBottom: '1px solid #1E1E2E' }}>
          <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Planned Allocation — by Group
          </span>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0D0D14' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Group</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Location</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Category</th>
                <th style={thStyle}>Target %</th>
                <th style={thStyle}>Current %</th>
                <th style={thStyle}>Diff %</th>
                <th style={thStyle}>Target Value</th>
                <th style={thStyle}>Current Value</th>
                <th style={thStyle}>Value Diff</th>
                <th style={thStyle}>Net PnL</th>
              </tr>
            </thead>
            <tbody>
              {mockPlannedGroups.map(g => {
                const gTargetPct = g.categories.reduce((s, c) => s + c.targetPct, 0)
                const gCurrentPct = g.categories.reduce((s, c) => s + c.currentPct, 0)
                const gTargetVal = g.categories.reduce((s, c) => s + c.targetValue, 0)
                const gCurrentVal = g.categories.reduce((s, c) => s + c.currentValue, 0)
                const gNetPnl = g.categories.reduce((s, c) => s + (c.netPnl ?? 0), 0)
                return (
                  <Fragment key={g.id}>
                    {g.categories.map((c, idx) => {
                      const diff = c.currentPct - c.targetPct
                      const valDiff = c.currentValue - c.targetValue
                      return (
                        <tr key={c.id} style={{ background: GROUP_BG[g.name], borderBottom: '1px solid #0D0D14' }}>
                          {idx === 0 && (
                            <td
                              rowSpan={g.categories.length}
                              style={{ padding: '10px 12px', textAlign: 'left', color: GROUP_COLOR[g.name], fontWeight: 700, fontSize: 13, verticalAlign: 'middle', borderRight: '1px solid #1E1E2E' }}
                            >
                              {g.name}
                            </td>
                          )}
                          <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{c.location}</td>
                          <td style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9' }}>{c.category}</td>
                          <td style={tdStyle}>{c.targetPct > 0 ? `${c.targetPct}%` : '—'}</td>
                          <td style={tdStyle}>{c.currentPct.toFixed(2)}%</td>
                          <td style={{ ...tdStyle, color: diff >= 0 ? '#10B981' : '#EF4444' }}>{formatPct(diff)}</td>
                          <td style={{ ...tdStyle, color: '#94A3B8' }}>{c.targetValue > 0 ? formatDisplay(convert(c.targetValue, 'CAD')) : '—'}</td>
                          <td style={{ ...tdStyle, color: '#F1F5F9' }}>{formatDisplay(convert(c.currentValue, 'CAD'))}</td>
                          <td style={{ ...tdStyle, color: valDiff >= 0 ? '#10B981' : '#EF4444' }}>
                            {valDiff >= 0 ? '+' : ''}{formatDisplay(convert(valDiff, 'CAD'))}
                          </td>
                          <td style={{ ...tdStyle, color: (c.netPnl ?? 0) >= 0 ? '#10B981' : '#EF4444' }}>
                            {(c.netPnl ?? 0) !== 0 ? formatDisplay(convert(c.netPnl ?? 0, 'CAD')) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                    <tr key={`sub-${g.id}`} style={{ background: 'rgba(0,0,0,0.25)', borderBottom: '2px solid #1E1E2E' }}>
                      <td colSpan={3} style={{ ...tdStyle, textAlign: 'left', color: GROUP_COLOR[g.name], fontWeight: 700 }}>Subtotal {g.name}</td>
                      <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 600 }}>{gTargetPct}%</td>
                      <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 600 }}>{gCurrentPct.toFixed(2)}%</td>
                      <td style={{ ...tdStyle, color: (gCurrentPct - gTargetPct) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {formatPct(gCurrentPct - gTargetPct)}
                      </td>
                      <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: 600 }}>{formatDisplay(convert(gTargetVal, 'CAD'))}</td>
                      <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatDisplay(convert(gCurrentVal, 'CAD'))}</td>
                      <td style={{ ...tdStyle, color: (gCurrentVal - gTargetVal) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {(gCurrentVal - gTargetVal) >= 0 ? '+' : ''}{formatDisplay(convert(gCurrentVal - gTargetVal, 'CAD'))}
                      </td>
                      <td style={{ ...tdStyle, color: gNetPnl >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {formatDisplay(convert(gNetPnl, 'CAD'))}
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
              {/* Grand total */}
              <tr style={{ borderTop: '2px solid #6366F1', background: '#0D0D14' }}>
                <td colSpan={3} style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9', fontWeight: 700 }}>Total</td>
                <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 700 }}>100%</td>
                <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 700 }}>
                  {mockPlannedGroups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.currentPct, 0), 0).toFixed(2)}%
                </td>
                <td style={tdStyle} />
                <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 700 }}>
                  {formatDisplay(convert(mockPlannedGroups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.targetValue, 0), 0), 'CAD'))}
                </td>
                <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 700 }}>
                  {formatDisplay(convert(TOTAL_CAD, 'CAD'))}
                </td>
                <td style={tdStyle} />
                <td style={{ ...tdStyle, color: '#10B981', fontWeight: 700 }}>
                  {formatDisplay(convert(mockPlannedGroups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + (c.netPnl ?? 0), 0), 0), 'CAD'))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Table 2: by Location */}
      <Card className="overflow-hidden" style={{ padding: 0 }}>
        <div className="px-4 py-3 md:px-5" style={{ borderBottom: '1px solid #1E1E2E' }}>
          <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Allocation by Location
          </span>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0D0D14' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Location</th>
                <th style={thStyle}>Target %</th>
                <th style={thStyle}>Current %</th>
                <th style={thStyle}>Diff %</th>
                <th style={thStyle}>Target Value</th>
                <th style={thStyle}>Current Value</th>
                <th style={thStyle}>Value Diff</th>
                <th style={thStyle}>Net PnL</th>
              </tr>
            </thead>
            <tbody>
              {locationRows.map(r => {
                const diff = r.currentPct - r.targetPct
                const valDiff = r.currentValue - r.targetValue
                return (
                  <tr key={r.location} style={{ borderBottom: '1px solid #0D0D14' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9', fontWeight: 600 }}>{r.location}</td>
                    <td style={tdStyle}>{r.targetPct > 0 ? `${r.targetPct}%` : '—'}</td>
                    <td style={tdStyle}>{r.currentPct.toFixed(2)}%</td>
                    <td style={{ ...tdStyle, color: diff >= 0 ? '#10B981' : '#EF4444' }}>{formatPct(diff)}</td>
                    <td style={{ ...tdStyle, color: '#94A3B8' }}>{r.targetValue > 0 ? formatDisplay(convert(r.targetValue, 'CAD')) : '—'}</td>
                    <td style={{ ...tdStyle, color: '#F1F5F9' }}>{formatDisplay(convert(r.currentValue, 'CAD'))}</td>
                    <td style={{ ...tdStyle, color: valDiff >= 0 ? '#10B981' : '#EF4444' }}>
                      {valDiff >= 0 ? '+' : ''}{formatDisplay(convert(valDiff, 'CAD'))}
                    </td>
                    <td style={{ ...tdStyle, color: r.netPnl >= 0 ? '#10B981' : '#EF4444' }}>
                      {formatDisplay(convert(r.netPnl, 'CAD'))}
                    </td>
                  </tr>
                )
              })}
              <tr style={{ borderTop: '2px solid #1E1E2E', background: '#0D0D14' }}>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9', fontWeight: 700 }}>Total</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{locationRows.reduce((s, r) => s + r.targetPct, 0)}%</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{locationRows.reduce((s, r) => s + r.currentPct, 0).toFixed(2)}%</td>
                <td style={tdStyle} />
                <td style={{ ...tdStyle, fontWeight: 700 }}>{formatDisplay(convert(locationRows.reduce((s, r) => s + r.targetValue, 0), 'CAD'))}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{formatDisplay(convert(locationRows.reduce((s, r) => s + r.currentValue, 0), 'CAD'))}</td>
                <td style={tdStyle} />
                <td style={{ ...tdStyle, fontWeight: 700, color: '#10B981' }}>
                  {formatDisplay(convert(locationRows.reduce((s, r) => s + r.netPnl, 0), 'CAD'))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Suggested Transactions */}
      <div>
        <button
          onClick={() => setShowSuggestions(s => !s)}
          aria-expanded={showSuggestions}
          className="min-h-11 w-full px-5 sm:w-auto md:min-h-10"
          style={{
            background: showSuggestions ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#818CF8',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {showSuggestions ? 'Hide' : 'Show'} Suggested Transactions
        </button>

        {showSuggestions && (
          <Card style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map(s => (
                <div key={`${s.category}-${s.location}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3" style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: s.diffVal > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${s.diffVal > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  <div className="min-w-0 break-words">
                    <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 13 }}>{s.category}</span>
                    <span style={{ color: '#94A3B8', fontSize: 12, marginLeft: 8 }}>({s.location})</span>
                  </div>
                  <span className="shrink-0 text-base tabular-nums md:text-sm" style={{
                    color: s.diffVal > 0 ? '#10B981' : '#EF4444',
                    fontWeight: 700,
                  }}>
                    {s.diffVal > 0
                      ? `BUY ${formatDisplay(convert(s.diffVal, 'CAD'))} more`
                      : `REDUCE ${formatDisplay(convert(Math.abs(s.diffVal), 'CAD'))}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
