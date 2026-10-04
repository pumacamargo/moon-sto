import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { parseTdCapture, type TdCapture } from '../lib/parsers/td'

const STALE_MS = 14 * 24 * 60 * 60 * 1000

export interface TdData {
  captures: TdCapture[]
  lastUpdated: Date | null
  isStale: boolean
  loading: boolean
  error: string | null
}

export function useTd(): TdData {
  const [data, setData] = useState<TdData>({
    captures: [], lastUpdated: null, isStale: true, loading: true, error: null,
  })

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(
          collection(db, 'page_captures'),
          where('brokerDomain', '==', 'td.com'),
        ))

        const tsToMs = (ts: any): number =>
          typeof ts?.toMillis === 'function' ? ts.toMillis() : new Date(ts).getTime()

        const docs = snap.docs.sort((a, b) =>
          tsToMs(b.data().capturedAt) - tsToMs(a.data().capturedAt)
        )

        // Keep the latest capture per account type
        const byType: Record<string, TdCapture> = {}
        for (const doc of docs) {
          const f = doc.data()
          const capturedAt = typeof f.capturedAt?.toDate === 'function'
            ? f.capturedAt.toDate() : new Date(f.capturedAt)
          const parsed = parseTdCapture(f.text, capturedAt)
          if (parsed && !byType[parsed.accountType]) {
            byType[parsed.accountType] = parsed
          }
        }

        const captures = Object.values(byType)
        const lastUpdated = captures.reduce<Date | null>((latest, c) => {
          if (!latest || c.capturedAt > latest) return c.capturedAt
          return latest
        }, null)
        const isStale = !lastUpdated || (Date.now() - lastUpdated.getTime()) > STALE_MS

        setData({ captures, loading: false, error: null, isStale, lastUpdated })
      } catch (err) {
        setData(d => ({ ...d, loading: false, error: String(err) }))
      }
    }
    load()
  }, [])

  return data
}
