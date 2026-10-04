import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  parseCetesDirectoCapture,
  type BonddiaCapture,
  type CetesCapture,
  type DepositCapture,
} from '../lib/parsers/cetesdirecto'

const STALE_MS = 14 * 24 * 60 * 60 * 1000

export interface CetesDirectoData {
  bonddia: BonddiaCapture | null
  cetes: CetesCapture | null
  deposits: DepositCapture[]
  totalDeposited: number
  totalCurrentValue: number
  totalGain: number
  lastUpdated: Date | null
  isStale: boolean
  loading: boolean
  error: string | null
}

const EMPTY: CetesDirectoData = {
  bonddia: null, cetes: null, deposits: [],
  totalDeposited: 0, totalCurrentValue: 0, totalGain: 0,
  lastUpdated: null, isStale: true, loading: true, error: null,
}

export function useCetesDirecto(): CetesDirectoData {
  const [data, setData] = useState<CetesDirectoData>(EMPTY)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(
          collection(db, 'page_captures'),
          where('brokerDomain', '==', 'www.cetesdirecto.com'),
        ))

        // Sort newest first in JS to avoid needing a composite Firestore index
        const docs = snap.docs.sort((a, b) =>
          b.data().capturedAt.localeCompare(a.data().capturedAt)
        )

        let bonddia: BonddiaCapture | null = null
        let cetes: CetesCapture | null = null
        const deposits: DepositCapture[] = []

        for (const doc of docs) {
          const f = doc.data()
          const parsed = parseCetesDirectoCapture(f.text, new Date(f.capturedAt))
          if (!parsed) continue
          if (parsed.type === 'bonddia' && !bonddia) bonddia = parsed
          else if (parsed.type === 'cetes' && !cetes) cetes = parsed
          else if (parsed.type === 'deposit') deposits.push(parsed)
        }

        const totalDeposited = deposits.reduce((s, d) => s + d.total, 0)
        const totalCurrentValue = (bonddia?.montoValuado ?? 0) + (cetes?.montoValuadoTotal ?? 0)
        const totalGain = totalCurrentValue - totalDeposited
        const lastUpdated = bonddia?.capturedAt ?? cetes?.capturedAt ?? null
        const isStale = !lastUpdated || (Date.now() - lastUpdated.getTime()) > STALE_MS

        setData({
          bonddia, cetes, deposits,
          totalDeposited, totalCurrentValue, totalGain,
          lastUpdated, isStale, loading: false, error: null,
        })
      } catch (err) {
        setData(d => ({ ...d, loading: false, error: String(err) }))
      }
    }
    load()
  }, [])

  return data
}
