import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { parseRakuten, type RakutenCapture } from '../lib/parsers/rakuten'

const STALE_MS = 14 * 24 * 60 * 60 * 1000

export interface RakutenData {
  capture: RakutenCapture | null
  lastUpdated: Date | null
  isStale: boolean
  loading: boolean
  error: string | null
}

export function useRakuten(): RakutenData {
  const [data, setData] = useState<RakutenData>({
    capture: null, lastUpdated: null, isStale: true, loading: true, error: null,
  })

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(
          collection(db, 'page_captures'),
          where('brokerDomain', '==', 'rakuten-sec.co.jp'),
          orderBy('capturedAt', 'desc'),
        ))

        let capture: RakutenCapture | null = null
        for (const doc of snap.docs) {
          const f = doc.data()
          const parsed = parseRakuten(f.text, new Date(f.capturedAt))
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
