import { useEffect, useState } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface PositionSnapshot {
  ticker: string
  name: string
  accountId: string
  category: string
  currency: 'CAD' | 'MXN' | 'JPY'
  costBasis: number
  currentValue: number
  pctGain: number
}

export interface PortfolioSnapshot {
  id: string
  date: Date
  totalCAD: number
  totalMXN: number
  totalJPY: number
  positions: PositionSnapshot[]
}

export function usePortfolioHistory(refreshKey = 0) {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const q = query(collection(db, 'portfolio_snapshots'), orderBy('date', 'asc'))
    getDocs(q)
      .then(snap => {
        setSnapshots(
          snap.docs.map(doc => {
            const d = doc.data()
            return {
              id: doc.id,
              date: d.date.toDate(),
              totalCAD: d.totalCAD ?? 0,
              totalMXN: d.totalMXN ?? 0,
              totalJPY: d.totalJPY ?? 0,
              positions: d.positions ?? [],
            }
          })
        )
        setError(null)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [refreshKey])

  return { snapshots, loading, error }
}
