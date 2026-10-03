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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      {/* Accounts */}
      <Card>
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Accounts</div>
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
                <td style={{ padding: '9px 10px', color: '#F1F5F9', fontWeight: 600 }}>{a.name}</td>
                <td style={{ padding: '9px 10px', color: '#94A3B8' }}>{a.location}</td>
                <td style={{ padding: '9px 10px', color: '#94A3B8' }}>{a.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Exchange Rates</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
              padding: '10px 14px', background: '#0D0D14', borderRadius: 8, border: '1px solid #1E1E2E',
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            readOnly
            style={{
              flex: 1, background: '#0D0D14', border: '1px solid #1E1E2E', color: '#F1F5F9',
              borderRadius: 8, padding: '8px 14px', fontSize: 14, fontFamily: 'monospace',
            }}
          />
          <button
            onClick={() => setShowToken(s => !s)}
            style={{
              background: '#1E1E2E', border: 'none', color: '#94A3B8',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}
          >
            {showToken ? 'Hide' : 'Show'}
          </button>
          <button
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
        <div style={{ display: 'flex', gap: 8 }}>
          {currencies.map(c => (
            <button
              key={c}
              onClick={() => setDisplayCurrency(c)}
              style={{
                padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
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
