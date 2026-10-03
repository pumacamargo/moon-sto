import { useState } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { mockTransfers } from '../lib/mockData'
import { formatCurrency } from '../lib/currency'

export default function Transfers() {
  const [filterFrom, setFilterFrom] = useState('all')
  const [filterTo, setFilterTo] = useState('all')

  const froms = [...new Set(mockTransfers.map((t) => t.from))]
  const tos = [...new Set(mockTransfers.map((t) => t.to))]

  const fromOptions = [{ value: 'all', label: 'All Sources' }, ...froms.map((f) => ({ value: f, label: f }))]
  const toOptions = [{ value: 'all', label: 'All Destinations' }, ...tos.map((t) => ({ value: t, label: t }))]

  const filtered = mockTransfers.filter((t) => {
    if (filterFrom !== 'all' && t.from !== filterFrom) return false
    if (filterTo !== 'all' && t.to !== filterTo) return false
    return true
  })

  const totalSent = filtered.reduce((s, t) => s + t.sentAmount, 0)
  const totalCommission = filtered.reduce((s, t) => s + t.commissionCAD, 0)
  const totalArriveCAD = filtered.reduce((s, t) => s + t.arriveInCAD, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select options={fromOptions} value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        <Select options={toOptions} value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Total Sent" value={formatCurrency(totalSent, 'CAD')} />
        <SummaryCard label="Total Arrive (CAD)" value={formatCurrency(totalArriveCAD, 'CAD')} />
        <SummaryCard label="Total Commission" value={formatCurrency(totalCommission, 'CAD')} color="#EF4444" />
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                  {['Date', 'From', 'To', 'Sent Amount', 'Currency', 'FX Rate', 'Arrive Amount', 'Arrive Curr.', 'Arrive (CAD)', 'Commission', 'Diff'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: '#94A3B8' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #1E1E2E' }}>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: '#94A3B8' }}>
                      {t.date.toLocaleDateString('en-CA')}
                    </td>
                    <td className="px-3 py-2.5 font-medium" style={{ color: '#F1F5F9' }}>{t.from}</td>
                    <td className="px-3 py-2.5" style={{ color: '#F1F5F9' }}>{t.to}</td>
                    <td className="px-3 py-2.5 text-right font-medium" style={{ color: '#F1F5F9' }}>
                      {formatCurrency(t.sentAmount, t.sentCurrency)}
                    </td>
                    <td className="px-3 py-2.5 text-center" style={{ color: '#94A3B8' }}>{t.sentCurrency}</td>
                    <td className="px-3 py-2.5 text-right" style={{ color: '#94A3B8' }}>{t.exchangeRate.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right" style={{ color: '#F1F5F9' }}>
                      {formatCurrency(t.arriveAmount, t.arriveCurrency)}
                    </td>
                    <td className="px-3 py-2.5 text-center" style={{ color: '#94A3B8' }}>{t.arriveCurrency}</td>
                    <td className="px-3 py-2.5 text-right" style={{ color: '#F1F5F9' }}>
                      {formatCurrency(t.arriveInCAD, 'CAD')}
                    </td>
                    <td className="px-3 py-2.5 text-right" style={{ color: '#EF4444' }}>
                      -{formatCurrency(t.commissionCAD, 'CAD')}
                    </td>
                    <td className="px-3 py-2.5 text-right" style={{ color: '#94A3B8' }}>
                      {t.difference === 0 ? '—' : formatCurrency(t.difference, 'CAD')}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(99,102,241,0.06)', borderTop: '2px solid #1E1E2E' }}>
                  <td colSpan={3} className="px-3 py-3 text-xs font-bold uppercase" style={{ color: '#94A3B8' }}>
                    Totals ({filtered.length} transfers)
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold" style={{ color: '#F1F5F9' }}>
                    {formatCurrency(totalSent, 'CAD')}
                  </td>
                  <td colSpan={4} />
                  <td className="px-3 py-3 text-right text-sm font-bold" style={{ color: '#F1F5F9' }}>
                    {formatCurrency(totalArriveCAD, 'CAD')}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold" style={{ color: '#EF4444' }}>
                    -{formatCurrency(totalCommission, 'CAD')}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: '#12121A', borderColor: '#1E1E2E' }}>
      <p className="text-xs" style={{ color: '#94A3B8' }}>{label}</p>
      <p className="text-lg font-bold mt-1" style={{ color: color ?? '#F1F5F9' }}>{value}</p>
    </div>
  )
}
