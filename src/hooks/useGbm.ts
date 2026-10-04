import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { parseGbm, type GbmCapture } from '../lib/parsers/gbm'

const STALE_MS = 14 * 24 * 60 * 60 * 1000

export interface GbmData {
  capture: GbmCapture | null
  lastUpdated: Date | null
  isStale: boolean
  loading: boolean
  error: string | null
}

export function useGbm(): GbmData {
  const [data, setData] = useState<GbmData>({
    capture: null, lastUpdated: null, isStale: true, loading: true, error: null,
  })

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(
          collection(db, 'page_captures'),
          where('brokerDomain', '==', 'www.appgbm.com'),
          orderBy('capturedAt', 'desc'),
        ))

        let capture: GbmCapture | null = null
        for (const doc of snap.docs) {
          const f = doc.data()
          const parsed = parseGbm(f.text, new Date(f.capturedAt))
          if (parsed) { capture = parsed; break }
        }

        const lastUpdated = capture?.capturedAt ?? null
        const isStale = !lastUpdated || (Date.now() - lastUpdated.getTime()) > STALE_MS

        setData({ capture, lastUpdated, isStale, loading: false, error: null })
      } catch (err) {
        setData(d => ({ ...d, loading: false, error: String(err) }))
      }
    }
    load()
  }, [])

  return data
}
