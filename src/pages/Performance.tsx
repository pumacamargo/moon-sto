import { useState } from 'react'
import { useCurrency } from '../contexts/CurrencyContext'
import { formatCurrency } from '../lib/currency'
import { mockPositions, mockAccounts } from '../lib/mockData'

type SortKey = 'pctGain' | 'gainDisplay' | 'currentValue'
type SortDir = 'asc' | 'desc'

export function Performance() {
  const { displayCurrency, convert } = useCurrency()
  const [sortKey, setSortKey] = useState<SortKey>('pctGain')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const positions = mockPositions
    .filter((p) => p.value > 0 || p.currentValue > 0)
    .map((p) => {
      const account = mockAccounts.find((a) => a.id === p.accountId)
      const gainOriginal = p.currentValue - p.value
      const gainDisplay = convert(gainOriginal, p.currency)
      const currentValueDisplay = convert(p.currentValue, p.currency)
      return { ...p, account, gainOriginal, gainDisplay, currentValueDisplay }
    })

  const sorted = [...positions].sort((a, b) => {
    const mult = sortDir === 'desc' ? -1 : 1
    if (sortKey === 'pctGain') return mult * (a.pctGain - b.pctGain)
    if (sortKey === 'gainDisplay') return mult * (a.gainDisplay - b.gainDisplay)
    if (sortKey === 'currentValue') return mult * (a.currentValueDisplay - b.currentValueDisplay)
    return 0
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const nonZeroGains = positions.filter((p) => p.pctGain !== 0)
  const best = nonZeroGains.reduce((best, p) => p.pctGain > best.pctGain ? p : best, nonZeroGains[0])
  const worst = nonZeroGains.reduce((worst, p) => p.pctGain < worst.pctGain ? p : worst, nonZeroGains[0])

  const totalGain = positions.reduce((sum, p) => sum + p.gainDisplay, 0)
  const totalInvested = positions.reduce((sum, p) => sum + convert(p.value, p.currency), 0)
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-[#6366F1]">
      {sortKey === k ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#F1F5F9]">Performance</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Gain / loss per position</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
          <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Total Gain / Loss</div>
          <div className={`text-xl font-semibold ${totalGain >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, displayCurrency)}
          </div>
          <div className={`text-sm mt-1 ${totalGainPct >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%
          </div>
        </div>

        {best && (
          <div className="bg-[#12121A] border border-[#10B981]/30 rounded-xl p-5">
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Best Performer</div>
            <div className="text-lg font-semibold text-[#F1F5F9]">{best.ticker}</div>
            <div className="text-sm text-[#10B981] mt-1">+{best.pctGain.toFixed(2)}%</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">{best.account?.name}</div>
          </div>
        )}

        {worst && (
          <div className="bg-[#12121A] border border-[#EF4444]/30 rounded-xl p-5">
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Worst Performer</div>
            <div className="text-lg font-semibold text-[#F1F5F9]">{worst.ticker}</div>
            <div className="text-sm text-[#EF4444] mt-1">{worst.pctGain.toFixed(2)}%</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">{worst.account?.name}</div>
          </div>
        )}

        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
          <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Positive Positions</div>
          <div className="text-xl font-semibold text-[#10B981]">
            {positions.filter((p) => p.pctGain > 0).length}
          </div>
          <div className="text-sm text-[#94A3B8] mt-1">
            of {positions.length} total
          </div>
        </div>
      </div>

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E1E2E]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Account</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Ticker</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cost (orig.)</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Current (orig.)</th>
              <th
                className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#F1F5F9]"
                onClick={() => toggleSort('gainDisplay')}
              >
                Gain ({displayCurrency}) <SortIcon k="gainDisplay" />
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#F1F5F9]"
                onClick={() => toggleSort('currentValue')}
              >
                Value ({displayCurrency}) <SortIcon k="currentValue" />
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer hover:text-[#F1F5F9]"
                onClick={() => toggleSort('pctGain')}
              >
                % Gain <SortIcon k="pctGain" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="border-b border-[#1E1E2E]/40 hover:bg-[#1E1E2E]/30">
                <td className="px-4 py-3 text-[#94A3B8]">{p.account?.name}</td>
                <td className="px-4 py-3 font-medium text-[#F1F5F9]">{p.ticker}</td>
                <td className="px-4 py-3 text-[#94A3B8]">{p.category}</td>
                <td className="px-4 py-3 text-[#94A3B8]">{formatCurrency(p.value, p.currency)}</td>
                <td className="px-4 py-3 text-[#F1F5F9]">{formatCurrency(p.currentValue, p.currency)}</td>
                <td className={`px-4 py-3 font-medium ${p.gainDisplay >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {p.gainDisplay >= 0 ? '+' : ''}{formatCurrency(p.gainDisplay, displayCurrency)}
                </td>
                <td className="px-4 py-3 text-[#F1F5F9]">{formatCurrency(p.currentValueDisplay, displayCurrency)}</td>
                <td className={`px-4 py-3 font-semibold ${p.pctGain >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {p.pctGain >= 0 ? '+' : ''}{p.pctGain.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
