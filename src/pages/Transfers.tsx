import { Card } from '../components/ui/Card'
import { mockTransfers } from '../lib/mockData'
import { formatCurrency } from '../lib/currency'

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
  color: '#94A3B8',
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '/')
}

export function Transfers() {
  const totalSent = mockTransfers.reduce((s, t) => s + t.sentAmount, 0)
  const totalCommission = mockTransfers.reduce((s, t) => s + t.commissionCAD, 0)
  const totalArriveCAD = mockTransfers.reduce((s, t) => s + t.arriveInCAD, 0)

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        <div className="min-w-0 p-3 sm:p-4" style={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: 12 }}>
          <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Sent</div>
          <div style={{ color: '#F1F5F9', fontWeight: 700 }} className="text-lg sm:text-xl tabular-nums break-words">{formatCurrency(totalSent, 'CAD')}</div>
        </div>
        <div className="min-w-0 p-3 sm:p-4" style={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: 12 }}>
          <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Arrived (CAD)</div>
          <div style={{ color: '#10B981', fontWeight: 700 }} className="text-lg sm:text-xl tabular-nums break-words">{formatCurrency(totalArriveCAD, 'CAD')}</div>
        </div>
        <div className="min-w-0 p-3 sm:p-4" style={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: 12 }}>
          <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Commission</div>
          <div style={{ color: '#EF4444', fontWeight: 700 }} className="text-lg sm:text-xl tabular-nums break-words">{formatCurrency(totalCommission, 'CAD')}</div>
        </div>
      </div>

      <Card className="overflow-hidden" style={{ padding: 0 }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0D0D14' }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Date</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>From</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>To</th>
                <th style={thStyle}>Sent Amount</th>
                <th style={thStyle}>Currency</th>
                <th style={thStyle}>FX Rate</th>
                <th style={thStyle}>Arrived</th>
                <th style={thStyle}>In Currency</th>
                <th style={thStyle}>In CAD</th>
                <th style={thStyle}>Commission (CAD)</th>
              </tr>
            </thead>
            <tbody>
              {mockTransfers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #0D0D14' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9' }}>{fmtDate(t.date)}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{t.from}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#94A3B8' }}>{t.to}</td>
                  <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 600 }}>{formatCurrency(t.sentAmount, t.sentCurrency)}</td>
                  <td style={tdStyle}>{t.sentCurrency}</td>
                  <td style={tdStyle}>{t.exchangeRate.toFixed(2)}</td>
                  <td style={{ ...tdStyle, color: '#10B981' }}>{formatCurrency(t.arriveAmount, t.arriveCurrency)}</td>
                  <td style={tdStyle}>{t.arriveCurrency}</td>
                  <td style={{ ...tdStyle, color: '#10B981' }}>{formatCurrency(t.arriveInCAD, 'CAD')}</td>
                  <td style={{ ...tdStyle, color: '#EF4444' }}>{formatCurrency(t.commissionCAD, 'CAD')}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #1E1E2E', background: '#0D0D14' }}>
                <td colSpan={3} style={{ ...tdStyle, textAlign: 'left', color: '#F1F5F9', fontWeight: 700 }}>Total</td>
                <td style={{ ...tdStyle, color: '#F1F5F9', fontWeight: 700 }}>{formatCurrency(totalSent, 'CAD')}</td>
                <td style={tdStyle} />
                <td style={tdStyle} />
                <td style={tdStyle} />
                <td style={tdStyle} />
                <td style={{ ...tdStyle, color: '#10B981', fontWeight: 700 }}>{formatCurrency(totalArriveCAD, 'CAD')}</td>
                <td style={{ ...tdStyle, color: '#EF4444', fontWeight: 700 }}>{formatCurrency(totalCommission, 'CAD')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
