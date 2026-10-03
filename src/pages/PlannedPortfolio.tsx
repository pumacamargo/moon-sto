import { useState } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useCurrency } from '../contexts/CurrencyContext'
import { formatCurrency } from '../lib/currency'
import { mockPlannedGroups, TOTAL_CAD } from '../lib/mockData'

const GROUP_STYLES = [
  { bg: 'rgba(99,102,241,0.06)', accent: '#6366F1', light: 'rgba(99,102,241,0.12)' },
  { bg: 'rgba(16,185,129,0.06)', accent: '#10B981', light: 'rgba(16,185,129,0.12)' },
  { bg: 'rgba(245,158,11,0.06)', accent: '#F59E0B', light: 'rgba(245,158,11,0.12)' },
]

export default function PlannedPortfolio() {
  const { displayCurrency, convert: convertDisplay } = useCurrency()
  const [showSuggestions, setShowSuggestions] = useState(false)

  const allCategories = mockPlannedGroups.flatMap((g) => g.categories)

  const locationSummary = (['Canada', 'Mexico', 'Japan'] as const).map((loc) => {
    const cats = allCategories.filter((c) => c.location === loc)
    const currentCAD = cats.reduce((s, c) => s + c.currentValue, 0)
    const targetCAD = cats.reduce((s, c) => s + c.targetValue, 0)
    const currentPct = (currentCAD / TOTAL_CAD) * 100
    const targetPct = (targetCAD / TOTAL_CAD) * 100
    return { loc, currentCAD, targetCAD, currentPct, targetPct }
  })

  const totalCurrentCAD = allCategories.reduce((s, c) => s + c.currentValue, 0)
  const totalTargetCAD = allCategories.reduce((s, c) => s + c.targetValue, 0)

  const suggestions = allCategories
    .filter((c) => c.targetValue > 0)
    .map((c) => ({
      category: c.category,
      location: c.location,
      diff: c.targetValue - c.currentValue,
    }))
    .filter((s) => Math.abs(s.diff) > 100)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          Target total: {formatCurrency(convertDisplay(TOTAL_CAD, 'CAD'), displayCurrency)}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setShowSuggestions((v) => !v)}>
          {showSuggestions ? 'Hide' : 'Show'} Suggested Transactions
        </Button>
      </div>

      {showSuggestions && (
        <Card>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F5F9' }}>Suggested Transactions</p>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.category + s.location} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#1E1E2E' }}>
                <div>
                  <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{s.category}</span>
                  <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>{s.location}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: s.diff > 0 ? '#10B981' : '#EF4444' }}>
                  {s.diff > 0 ? 'BUY' : 'SELL'} {formatCurrency(Math.abs(convertDisplay(s.diff, 'CAD')), displayCurrency)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                  {['Group', 'Location', 'Category', 'Target %', 'Current %', 'Difference', 'Target Value', 'Current Value', 'Value Diff'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: '#94A3B8' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockPlannedGroups.map((g, gi) => {
                  const style = GROUP_STYLES[gi % GROUP_STYLES.length]
                  const groupCurrentCAD = g.categories.reduce((s, c) => s + c.currentValue, 0)
                  const groupTargetCAD = g.categories.reduce((s, c) => s + c.targetValue, 0)
                  const groupCurrentPct = (groupCurrentCAD / TOTAL_CAD) * 100
                  const groupDiff = groupCurrentPct - g.targetPct
                  return (
                    <>
                      <tr key={`group-${g.id}`} style={{ background: style.light, borderBottom: '1px solid #1E1E2E' }}>
                        <td colSpan={9} className="px-3 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: style.accent }}>
                          {g.name} — Target {g.targetPct}% | Current {groupCurrentPct.toFixed(1)}%
                        </td>
                      </tr>
                      {g.categories.map((cat) => {
                        const diffPct = cat.currentPct - cat.targetPct
                        const valueDiffCAD = cat.currentValue - cat.targetValue
                        return (
                          <tr key={cat.id} style={{ background: style.bg, borderBottom: '1px solid #1E1E2E' }}>
                            <td className="px-3 py-2.5" style={{ color: style.accent, fontSize: 11 }}>{g.name}</td>
                            <td className="px-3 py-2.5" style={{ color: '#94A3B8' }}>{cat.location}</td>
                            <td className="px-3 py-2.5 font-medium" style={{ color: '#F1F5F9' }}>{cat.category}</td>
                            <td className="px-3 py-2.5 text-right" style={{ color: '#F1F5F9' }}>{cat.targetPct}%</td>
                            <td className="px-3 py-2.5 text-right" style={{ color: '#F1F5F9' }}>{cat.currentPct.toFixed(2)}%</td>
                            <td className="px-3 py-2.5 text-right" style={{ color: diffPct >= 0 ? '#10B981' : '#EF4444' }}>
                              {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2)}%
                            </td>
                            <td className="px-3 py-2.5 text-right" style={{ color: '#94A3B8' }}>
                              {formatCurrency(convertDisplay(cat.targetValue, 'CAD'), displayCurrency)}
                            </td>
                            <td className="px-3 py-2.5 text-right" style={{ color: '#F1F5F9' }}>
                              {formatCurrency(convertDisplay(cat.currentValue, 'CAD'), displayCurrency)}
                            </td>
                            <td className="px-3 py-2.5 text-right" style={{ color: valueDiffCAD >= 0 ? '#10B981' : '#EF4444' }}>
                              {valueDiffCAD >= 0 ? '+' : ''}{formatCurrency(convertDisplay(valueDiffCAD, 'CAD'), displayCurrency)}
                            </td>
                          </tr>
                        )
                      })}
                      <tr key={`subtotal-${g.id}`} style={{ background: style.light, borderBottom: '2px solid #1E1E2E' }}>
                        <td colSpan={3} className="px-3 py-2 text-xs font-semibold" style={{ color: style.accent }}>
                          Group Total
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: '#F1F5F9' }}>{g.targetPct}%</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: '#F1F5F9' }}>{groupCurrentPct.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: groupDiff >= 0 ? '#10B981' : '#EF4444' }}>
                          {groupDiff >= 0 ? '+' : ''}{groupDiff.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: '#94A3B8' }}>
                          {formatCurrency(convertDisplay(groupTargetCAD, 'CAD'), displayCurrency)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: '#F1F5F9' }}>
                          {formatCurrency(convertDisplay(groupCurrentCAD, 'CAD'), displayCurrency)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: groupCurrentCAD - groupTargetCAD >= 0 ? '#10B981' : '#EF4444' }}>
                          {groupCurrentCAD - groupTargetCAD >= 0 ? '+' : ''}{formatCurrency(convertDisplay(groupCurrentCAD - groupTargetCAD, 'CAD'), displayCurrency)}
                        </td>
                      </tr>
                    </>
                  )
                })}
                <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <td colSpan={3} className="px-3 py-3 text-xs font-bold uppercase" style={{ color: '#F1F5F9' }}>
                    TOTAL
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: '#F1F5F9' }}>100%</td>
                  <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: '#F1F5F9' }}>
                    {((totalCurrentCAD / TOTAL_CAD) * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: '#94A3B8' }}>—</td>
                  <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: '#94A3B8' }}>
                    {formatCurrency(convertDisplay(totalTargetCAD, 'CAD'), displayCurrency)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: '#F1F5F9' }}>
                    {formatCurrency(convertDisplay(totalCurrentCAD, 'CAD'), displayCurrency)}
                  </td>
                  <td className="px-3 py-3 text-right text-xs font-bold" style={{ color: totalCurrentCAD - totalTargetCAD >= 0 ? '#10B981' : '#EF4444' }}>
                    {totalCurrentCAD - totalTargetCAD >= 0 ? '+' : ''}{formatCurrency(convertDisplay(totalCurrentCAD - totalTargetCAD, 'CAD'), displayCurrency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3" style={{ color: '#F1F5F9' }}>By Location</p>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                  {['Location', 'Target %', 'Current %', 'Difference', 'Target Value', 'Current Value'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locationSummary.map((l) => {
                  const diff = l.currentPct - l.targetPct
                  return (
                    <tr key={l.loc} style={{ borderBottom: '1px solid #1E1E2E' }}>
                      <td className="px-3 py-2.5 font-medium" style={{ color: '#F1F5F9' }}>{l.loc}</td>
                      <td className="px-3 py-2.5" style={{ color: '#F1F5F9' }}>{l.targetPct.toFixed(1)}%</td>
                      <td className="px-3 py-2.5" style={{ color: '#F1F5F9' }}>{l.currentPct.toFixed(1)}%</td>
                      <td className="px-3 py-2.5" style={{ color: diff >= 0 ? '#10B981' : '#EF4444' }}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5" style={{ color: '#94A3B8' }}>
                        {formatCurrency(convertDisplay(l.targetCAD, 'CAD'), displayCurrency)}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: '#F1F5F9' }}>
                        {formatCurrency(convertDisplay(l.currentCAD, 'CAD'), displayCurrency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
