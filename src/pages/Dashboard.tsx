import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { StatCard } from '../components/ui/StatCard'
import { Card, CardTitle, CardHeader } from '../components/ui/Card'
import { useCurrency } from '../contexts/CurrencyContext'
import { mockPlannedGroups, mockPositions, mockAccounts, TOTAL_CAD } from '../lib/mockData'
import { formatPct } from '../lib/currency'

const GROUP_COLORS: Record<string, string> = {
  Productive: '#6366F1',
  Liquidity: '#10B981',
  Protection: '#F59E0B',
}

export function Dashboard() {
  const { convert, formatDisplay } = useCurrency()

  const totalDisplay = convert(TOTAL_CAD, 'CAD')

  const totalNetPnl = mockPlannedGroups
    .flatMap(g => g.categories)
    .reduce((sum, c) => sum + (c.netPnl ?? 0), 0)

  const totalNetPnlDisplay = convert(totalNetPnl, 'CAD')

  const positionCount = mockPositions.filter(p => p.currentValue > 0).length
  const accountCount = mockAccounts.length

  const pieData = mockPlannedGroups.map(g => ({
    name: g.name,
    value: g.categories.reduce((sum, c) => sum + c.currentValue, 0),
    color: GROUP_COLORS[g.name] ?? '#94A3B8',
  }))

  const locationData = [
    {
      location: 'Canada',
      target: 32,
      current: mockPlannedGroups
        .flatMap(g => g.categories)
        .filter(c => c.location === 'Canada')
        .reduce((sum, c) => sum + c.currentPct, 0),
    },
    {
      location: 'Mexico',
      target: 38,
      current: mockPlannedGroups
        .flatMap(g => g.categories)
        .filter(c => c.location === 'Mexico')
        .reduce((sum, c) => sum + c.currentPct, 0),
    },
    {
      location: 'Japan',
      target: 30,
      current: mockPlannedGroups
        .flatMap(g => g.categories)
        .filter(c => c.location === 'Japan')
        .reduce((sum, c) => sum + c.currentPct, 0),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          label="Total Portfolio"
          value={formatDisplay(totalDisplay)}
        />
        <StatCard
          label="Net P&L"
          value={formatDisplay(totalNetPnlDisplay)}
          sub={totalNetPnl >= 0 ? `+${formatDisplay(totalNetPnlDisplay)}` : formatDisplay(totalNetPnlDisplay)}
          trend={totalNetPnl}
        />
        <StatCard
          label="Positions"
          value={String(positionCount)}
          sub={`${mockPositions.length} total`}
        />
        <StatCard
          label="Accounts"
          value={String(accountCount)}
          sub="Across 3 countries"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader>
            <CardTitle>Allocation by Group</CardTitle>
          </CardHeader>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }}
                  formatter={(val: number) => [formatDisplay(convert(val, 'CAD')), '']}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target vs Current % by Location</CardTitle>
          </CardHeader>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="location" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }}
                  formatter={(val: number) => [`${val.toFixed(1)}%`, '']}
                />
                <Legend formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{value}</span>} />
                <Bar dataKey="target" name="Target %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name="Current %" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Group Summary</CardTitle>
        </CardHeader>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Group', 'Target %', 'Current %', 'Difference', 'Target Value', 'Current Value', 'Net PnL'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Group' ? 'left' : 'right', padding: '8px 12px', color: '#94A3B8', fontWeight: 500, borderBottom: '1px solid #1E1E2E', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockPlannedGroups.map(g => {
                const currentPct = g.categories.reduce((s, c) => s + c.currentPct, 0)
                const targetVal = g.categories.reduce((s, c) => s + c.targetValue, 0)
                const currentVal = g.categories.reduce((s, c) => s + c.currentValue, 0)
                const netPnl = g.categories.reduce((s, c) => s + (c.netPnl ?? 0), 0)
                const diff = currentPct - g.targetPct
                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid #1E1E2E' }}>
                    <td style={{ padding: '10px 12px', color: '#F1F5F9', fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: GROUP_COLORS[g.name], marginRight: 8 }} />
                      {g.name}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94A3B8' }}>{g.targetPct}%</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94A3B8' }}>{currentPct.toFixed(2)}%</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: diff >= 0 ? '#10B981' : '#EF4444' }}>{formatPct(diff)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94A3B8' }}>{formatDisplay(convert(targetVal, 'CAD'))}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#F1F5F9' }}>{formatDisplay(convert(currentVal, 'CAD'))}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: netPnl >= 0 ? '#10B981' : '#EF4444' }}>{formatDisplay(convert(netPnl, 'CAD'))}</td>
                  </tr>
                )
              })}
              <tr style={{ borderTop: '2px solid #1E1E2E' }}>
                <td style={{ padding: '10px 12px', color: '#F1F5F9', fontWeight: 700 }}>Total</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#F1F5F9', fontWeight: 600 }}>100%</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#F1F5F9', fontWeight: 600 }}>
                  {mockPlannedGroups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.currentPct, 0), 0).toFixed(2)}%
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }} />
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#F1F5F9', fontWeight: 600 }}>
                  {formatDisplay(convert(mockPlannedGroups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.targetValue, 0), 0), 'CAD'))}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#F1F5F9', fontWeight: 600 }}>
                  {formatDisplay(convert(mockPlannedGroups.reduce((s, g) => s + g.categories.reduce((ss, c) => ss + c.currentValue, 0), 0), 'CAD'))}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: totalNetPnl >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                  {formatDisplay(convert(totalNetPnl, 'CAD'))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
