import { useEffect, useRef } from 'react'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { useAllPositions } from './useAllPositions'
import { db } from '../lib/firebase'
import { exchangeRates } from '../lib/portfolioData'
import type { Currency } from '../types'

const LS_KEY = 'moonsto.lastSnapshotBrokerTs'

function toCAD(amount: number, currency: Currency): number {
  if (currency === 'CAD') return amount
  if (currency === 'MXN') return amount * exchangeRates.MXN_CAD
  return amount * exchangeRates.JPY_CAD
}

export function useAutoSnapshot() {
  const { positions, loading, cetes, gbm, rakuten, td } = useAllPositions()
  const saving = useRef(false)

  useEffect(() => {
    if (loading || positions.length === 0 || saving.current) return

    const timestamps = [cetes.lastUpdated, gbm.lastUpdated, rakuten.lastUpdated, td.lastUpdated]
      .filter((t): t is Date => t != null)
    if (timestamps.length === 0) return

    const latestTs = new Date(Math.max(...timestamps.map(t => t.getTime())))
    const latestTsStr = latestTs.toISOString()

    if (localStorage.getItem(LS_KEY) === latestTsStr) return

    saving.current = true

    const totalCAD = positions.reduce((s, p) => s + toCAD(p.currentValue, p.currency), 0)
    const totalMXN = positions
      .filter(p => p.currency === 'MXN')
      .reduce((s, p) => s + p.currentValue, 0)
    const totalJPY = positions
      .filter(p => p.currency === 'JPY')
      .reduce((s, p) => s + p.currentValue, 0)

    addDoc(collection(db, 'portfolio_snapshots'), {
      date: Timestamp.now(),
      totalCAD,
      totalMXN,
      totalJPY,
      positions: positions.map(p => ({
        ticker: p.ticker,
        name: p.name ?? p.ticker,
        accountId: p.accountId,
        category: p.category,
        currency: p.currency,
        costBasis: p.value,
        currentValue: p.currentValue,
        pctGain: p.pctGain,
      })),
    })
      .then(() => { localStorage.setItem(LS_KEY, latestTsStr) })
      .finally(() => { saving.current = false })
  }, [loading, positions, cetes.lastUpdated, gbm.lastUpdated, rakuten.lastUpdated, td.lastUpdated])
}
