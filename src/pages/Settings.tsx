import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { useCurrency } from '../contexts/CurrencyContext'
import { mockAccounts, mockExchangeRates } from '../lib/mockData'
import type { Currency } from '../types'

const currencies: Currency[] = ['CAD', 'MXN', 'JPY']

export function Settings() {
  const { displayCurrency, setDisplayCurrency } = useCurrency()
  const [token, setToken] = useState('••••••••••••')
  const [showToken, setShowToken] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3 md:mx-0 md:gap-5">
      {/* Accounts */}
      <Card>
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Accounts</div>
        <div className="table-scroll -mx-4 md:mx-0">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Account', 'Location', 'Currency'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#94A3B8', fontWeight: 500, borderBottom: '1px solid #1E1E2E', fontSize: 12 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockAccounts.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #0D0D14' }}>
                <td style={{ padding: '12px 10px', color: '#F1F5F9', fontWeight: 600 }}>{a.name}</td>
                <td style={{ padding: '12px 10px', color: '#94A3B8' }}>{a.location}</td>
                <td style={{ padding: '12px 10px', color: '#94A3B8' }}>{a.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Exchange Rates</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
          {[
            { label: 'CAD → MXN', value: mockExchangeRates.CAD_MXN },
            { label: 'CAD → JPY', value: mockExchangeRates.CAD_JPY },
            { label: 'MXN → CAD', value: mockExchangeRates.MXN_CAD },
            { label: 'JPY → CAD', value: mockExchangeRates.JPY_CAD },
            { label: 'MXN → JPY', value: mockExchangeRates.MXN_JPY },
            { label: 'JPY → MXN', value: mockExchangeRates.JPY_MXN },
          ].map(r => (
            <div key={r.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', gap: 8, background: '#0D0D14', borderRadius: 8, border: '1px solid #1E1E2E',
            }}>
              <span style={{ color: '#94A3B8', fontSize: 13 }}>{r.label}</span>
              <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, color: '#4B5563', fontSize: 11 }}>
          Last updated: {mockExchangeRates.updatedAt.toLocaleString()}
        </div>
      </Card>

      {/* Extension Token */}
      <Card>
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Extension Token</div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-2.5">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            readOnly
            className="min-h-11 w-full min-w-0 sm:w-auto sm:flex-1 md:min-h-10"
            style={{
              background: '#0D0D14', border: '1px solid #1E1E2E', color: '#F1F5F9',
              borderRadius: 8, padding: '8px 14px', fontSize: 14, fontFamily: 'monospace',
            }}
          />
          <button
            onClick={() => setShowToken(s => !s)}
            className="min-h-11 flex-1 sm:flex-none md:min-h-10"
            style={{
              background: '#1E1E2E', border: 'none', color: '#94A3B8',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}
          >
            {showToken ? 'Hide' : 'Show'}
          </button>
          <button
            className="min-h-11 flex-1 sm:flex-none md:min-h-10"
            onClick={() => setToken(Math.random().toString(36).slice(2, 14).toUpperCase())}
            style={{
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            Regenerate
          </button>
        </div>
      </Card>

      {/* Display Currency */}
      <Card>
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Display Currency</div>
        <div className="flex gap-2">
          {currencies.map(c => (
            <button
              key={c}
              onClick={() => setDisplayCurrency(c)}
              className="min-h-11 flex-1 sm:flex-none sm:px-6 md:min-h-10"
              style={{
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: displayCurrency === c ? '#6366F1' : '#1E1E2E',
                color: displayCurrency === c ? '#fff' : '#94A3B8',
                fontWeight: displayCurrency === c ? 700 : 400,
                fontSize: 14, transition: 'all 0.15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
