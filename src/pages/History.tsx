import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { usePortfolioHistory } from '../hooks/usePortfolioHistory'

function fmtCAD(n: number) {
  return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function History() {
  const { snapshots, loading: historyLoading } = usePortfolioHistory()

  const chartData = snapshots.map(s => ({
    label: s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: Math.round(s.totalCAD * 100) / 100,
  }))

  const latestTotal = snapshots.length > 0 ? snapshots[snapshots.length - 1].totalCAD : null
  const firstTotal = snapshots.length > 1 ? snapshots[0].totalCAD : null
  const totalGain = latestTotal != null && firstTotal != null ? latestTotal - firstTotal : null
  const totalGainPct =
    totalGain != null && firstTotal != null && firstTotal > 0
      ? (totalGain / firstTotal) * 100
      : null

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold" style={{ color: '#F1F5F9' }}>
          Portfolio History
        </h2>
        <p className="mt-0.5 text-sm" style={{ color: '#64748B' }}>
          {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} · saved automatically when broker data updates
        </p>
      </div>

      {/* Summary stats */}
      {snapshots.length > 1 && latestTotal != null && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Current Value', value: `$${fmtCAD(latestTotal)} CAD`, positive: null },
            {
              label: 'Total Change',
              value: totalGain != null ? `${totalGain >= 0 ? '+' : ''}$${fmtCAD(totalGain)} CAD` : '—',
              positive: totalGain != null ? totalGain >= 0 : null,
            },
            {
              label: 'Return',
              value: totalGainPct != null ? `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%` : '—',
              positive: totalGainPct != null ? totalGainPct >= 0 : null,
            },
            {
              label: 'Since',
              value: fmtDate(snapshots[0].date),
              positive: null,
            },
          ].map(({ label, value, positive }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: '#12121A', border: '1px solid #1E1E2E' }}
            >
              <p className="text-xs font-medium" style={{ color: '#64748B' }}>
                {label}
              </p>
              <p
                className="mt-1 text-sm font-semibold"
                style={{
                  color: positive === null ? '#F1F5F9' : positive ? '#10B981' : '#EF4444',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <Card style={{ padding: 0 }}>
        <div className="px-4 py-3 md:px-5" style={{ borderBottom: '1px solid #1E1E2E' }}>
          <span
            style={{
              color: '#94A3B8',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Total Portfolio Value (CAD)
          </span>
        </div>

        {historyLoading ? (
          <div
            className="m-4 animate-pulse rounded-lg"
            style={{ height: 260, background: '#1E1E2E' }}
          />
        ) : chartData.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <p style={{ color: '#64748B', fontSize: 14 }}>No history yet</p>
            <p style={{ color: '#475569', fontSize: 12 }}>
              Snapshots save automatically when the extension updates broker data
            </p>
          </div>
        ) : chartData.length === 1 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1">
            <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
              ${fmtCAD(chartData[0].total)} CAD
            </p>
            <p style={{ color: '#64748B', fontSize: 12 }}>
              First snapshot on {fmtDate(snapshots[0].date)} · update broker data again to see a chart
            </p>
          </div>
        ) : (
          <div style={{ padding: '16px 4px 8px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={62}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1E1E2E',
                    border: '1px solid #2D2D40',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`$${fmtCAD(Number(v))} CAD`, 'Total']}
                  labelStyle={{ color: '#F1F5F9', marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#historyGrad)"
                  dot={{ fill: '#6366F1', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#818CF8' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Snapshots table */}
      {snapshots.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div className="px-4 py-3 md:px-5" style={{ borderBottom: '1px solid #1E1E2E' }}>
            <span
              style={{
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Snapshots
            </span>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0D0D14' }}>
                  {['Date', 'Total (CAD eq.)', 'MXN raw', 'JPY raw', 'Positions', 'vs Previous'].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 12px',
                          color: '#64748B',
                          fontWeight: 500,
                          fontSize: 11,
                          borderBottom: '1px solid #1E1E2E',
                          textAlign: i === 0 ? 'left' : 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((s, i, arr) => {
                  const prev = arr[i + 1]
                  const chg = prev ? s.totalCAD - prev.totalCAD : null
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #0D0D14' }}>
                      <td style={{ padding: '9px 12px', color: '#F1F5F9', fontSize: 13 }}>
                        {fmtDate(s.date)}
                      </td>
                      <td
                        style={{
                          padding: '9px 12px',
                          textAlign: 'right',
                          color: '#F1F5F9',
                          fontWeight: 600,
                          fontSize: 13,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        ${fmtCAD(s.totalCAD)}
                      </td>
                      <td
                        style={{
                          padding: '9px 12px',
                          textAlign: 'right',
                          color: '#94A3B8',
                          fontSize: 12,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {s.totalMXN > 0
                          ? `$${s.totalMXN.toLocaleString('en-MX', { maximumFractionDigits: 0 })}`
                          : '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 12px',
                          textAlign: 'right',
                          color: '#94A3B8',
                          fontSize: 12,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {s.totalJPY > 0
                          ? `¥${s.totalJPY.toLocaleString('en-JP', { maximumFractionDigits: 0 })}`
                          : '—'}
                      </td>
                      <td
                        style={{
                          padding: '9px 12px',
                          textAlign: 'right',
                          color: '#94A3B8',
                          fontSize: 12,
                        }}
                      >
                        {s.positions.length}
                      </td>
                      <td
                        style={{
                          padding: '9px 12px',
                          textAlign: 'right',
                          fontSize: 12,
                          fontVariantNumeric: 'tabular-nums',
                          color:
                            chg == null ? '#64748B' : chg >= 0 ? '#10B981' : '#EF4444',
                        }}
                      >
                        {chg == null
                          ? '—'
                          : `${chg >= 0 ? '+' : ''}$${fmtCAD(chg)}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
