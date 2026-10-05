/**
 * Generates public/snapshot.html — a static, JS-free page with real portfolio data
 * readable by AI web tools (ChatGPT, Claude, etc.) that can't execute JavaScript.
 *
 * Connects to Firestore REST API (page_captures is publicly readable),
 * runs the same parsers as the app, and writes plain HTML.
 *
 * Usage: npm run snapshot
 */

import fs from 'fs'
import path from 'path'
import { parseCetesDirectoCapture } from '../src/lib/parsers/cetesdirecto.js'
import { parseGbm } from '../src/lib/parsers/gbm.js'
import { parseRakuten } from '../src/lib/parsers/rakuten.js'
import { parseTdCapture } from '../src/lib/parsers/td.js'
import type {
  BonddiaCapture, CetesCapture, DepositCapture,
} from '../src/lib/parsers/cetesdirecto.js'
import type { GbmCapture }    from '../src/lib/parsers/gbm.js'
import type { RakutenCapture } from '../src/lib/parsers/rakuten.js'
import type { TdCapture }     from '../src/lib/parsers/td.js'

// ─── Load env ────────────────────────────────────────────────────────────────

const envRaw = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
const env = (key: string) => envRaw.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim() ?? ''

const API_KEY    = env('VITE_FIREBASE_API_KEY')
const PROJECT_ID = env('VITE_FIREBASE_PROJECT_ID')

if (!API_KEY || !PROJECT_ID) {
  console.error('Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in .env')
  process.exit(1)
}

// ─── Firestore REST ───────────────────────────────────────────────────────────

function parseField(f: any): any {
  if (!f) return null
  if ('stringValue'    in f) return f.stringValue
  if ('integerValue'   in f) return parseInt(f.integerValue, 10)
  if ('doubleValue'    in f) return f.doubleValue
  if ('booleanValue'   in f) return f.booleanValue
  if ('timestampValue' in f) return new Date(f.timestampValue)
  if ('mapValue'       in f) {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries<any>(f.mapValue.fields ?? {})) out[k] = parseField(v)
    return out
  }
  if ('arrayValue' in f) return (f.arrayValue.values ?? []).map(parseField)
  return null
}

async function fetchCollection(col: string): Promise<Record<string, any>[]> {
  const docs: Record<string, any>[] = []
  let pageToken: string | undefined
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${col}`
    )
    url.searchParams.set('key', API_KEY)
    url.searchParams.set('pageSize', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Firestore ${res.status}: ${await res.text()}`)
    const data: any = await res.json()
    for (const doc of data.documents ?? []) {
      const out: Record<string, any> = {}
      for (const [k, v] of Object.entries<any>(doc.fields ?? {})) out[k] = parseField(v)
      docs.push(out)
    }
    pageToken = data.nextPageToken
  } while (pageToken)
  return docs
}

// ─── Build portfolio ──────────────────────────────────────────────────────────

interface Position {
  broker: string
  ticker: string
  name?: string
  account: string
  category: string
  currency: 'CAD' | 'MXN' | 'JPY'
  cost: number
  current: number
  pctGain: number
}

async function buildPortfolio() {
  console.log(`Fetching page_captures from ${PROJECT_ID}…`)
  const captures = await fetchCollection('page_captures')
  console.log(`  ${captures.length} documents found`)

  const tsToMs = (ts: any): number =>
    ts instanceof Date ? ts.getTime() : new Date(ts).getTime()

  const sorted = captures.sort((a, b) => tsToMs(b.capturedAt) - tsToMs(a.capturedAt))

  let bonddia: BonddiaCapture | null = null
  let cetes:   CetesCapture   | null = null
  const deposits: DepositCapture[] = []
  let gbm:     GbmCapture     | null = null
  let rakuten: RakutenCapture | null = null
  const tdByType: Record<string, TdCapture> = {}

  for (const doc of sorted) {
    const capturedAt = doc.capturedAt instanceof Date ? doc.capturedAt : new Date(doc.capturedAt)
    const text: string = doc.text ?? ''

    const domain: string = doc.brokerDomain ?? ''

    if (domain === 'www.cetesdirecto.com') {
      const p = parseCetesDirectoCapture(text, capturedAt)
      if (!p) continue
      if (p.type === 'bonddia' && !bonddia) bonddia = p
      else if (p.type === 'cetes' && !cetes) cetes = p
      else if (p.type === 'deposit') deposits.push(p)
    } else if (domain === 'www.appgbm.com') {
      if (!gbm) { const p = parseGbm(text, capturedAt); if (p) gbm = p }
    } else if (domain === 'rakuten-sec.co.jp') {
      if (!rakuten) { const p = parseRakuten(text, capturedAt); if (p) rakuten = p }
    } else if (domain === 'td.com') {
      const p = parseTdCapture(text, capturedAt)
      if (p && !tdByType[p.accountType]) tdByType[p.accountType] = p
    }
  }

  const positions: Position[] = []

  // ── CETES ──
  if (bonddia) {
    const cost = bonddia.montoValuado - bonddia.plusvalia
    positions.push({
      broker: 'CETESdirecto', ticker: 'BONDDIA', account: 'Cash Mexico',
      category: 'Bonddia', currency: 'MXN',
      cost, current: bonddia.montoValuado,
      pctGain: cost > 0 ? (bonddia.plusvalia / cost) * 100 : 0,
    })
  }
  if (cetes) {
    const totalDeposited = deposits.reduce((s, d) => s + d.total, 0)
    const bonddiaCost = bonddia ? bonddia.montoValuado - bonddia.plusvalia : 0
    const cetesOriginalTotal = totalDeposited > 0 && bonddiaCost > 0
      ? totalDeposited - bonddiaCost : 0
    const totalMontoInv = cetes.posiciones.reduce((s, p) => s + p.montoInvertido, 0)
    for (const pos of cetes.posiciones) {
      const origCost = cetesOriginalTotal > 0 && totalMontoInv > 0
        ? cetesOriginalTotal * (pos.montoInvertido / totalMontoInv)
        : pos.montoInvertido
      positions.push({
        broker: 'CETESdirecto', ticker: `CETES ${pos.serie}`,
        name: `Plazo ${pos.plazo} · Tasa ${pos.tasaCompra}%`,
        account: 'CETES', category: 'Cetes', currency: 'MXN',
        cost: origCost, current: pos.montoValuado,
        pctGain: origCost > 0 ? ((pos.montoValuado - origCost) / origCost) * 100 : 0,
      })
    }
  }

  // ── GBM ──
  if (gbm) {
    for (const pos of gbm.posiciones) {
      positions.push({
        broker: 'GBM', ticker: pos.ticker, account: 'GBM',
        category: pos.seccion === 'capitales' ? 'REITs / InfrastructureM' : 'Reporto',
        currency: 'MXN',
        cost: pos.impXCto, current: pos.valorMerc, pctGain: pos.varHistPct,
      })
    }
  }

  // ── Rakuten ──
  if (rakuten) {
    for (const pos of rakuten.posiciones) {
      positions.push({
        broker: 'Rakuten', ticker: pos.tickerCode, name: pos.name,
        account: 'NISA', category: 'Productive Assets JP', currency: 'JPY',
        cost: pos.costBasis, current: pos.marketValue, pctGain: pos.pctGain,
      })
    }
    if (rakuten.cashJpy > 0) {
      positions.push({
        broker: 'Rakuten', ticker: 'Cash JPY', account: 'NISA',
        category: 'Cash', currency: 'JPY',
        cost: rakuten.cashJpy, current: rakuten.cashJpy, pctGain: 0,
      })
    }
  }

  // ── TD ──
  const TD_CATS: Record<string, string> = {
    KILO: 'Metals & Commodities', SBT: 'Metals & Commodities',
    UEC: 'Metals & Commodities', IAU: 'Metals & Commodities',
    MSFT: 'Productive Assets US', CIBR: 'Productive Assets US',
    QS: 'Productive Assets US', UBI: 'Productive Assets US', U: 'Productive Assets US',
  }
  for (const capture of Object.values(tdByType)) {
    for (const pos of capture.positions) {
      positions.push({
        broker: 'TD Bank', ticker: pos.ticker, name: pos.name,
        account: capture.accountType, category: TD_CATS[pos.ticker] ?? 'Productive Assets US',
        currency: 'CAD',
        cost: pos.bookCost, current: pos.marketValue, pctGain: pos.unrealizedPct,
      })
    }
    if (capture.cashBalance > 0) {
      positions.push({
        broker: 'TD Bank', ticker: 'Cash CAD', account: capture.accountType,
        category: 'Cash', currency: 'CAD',
        cost: capture.cashBalance, current: capture.cashBalance, pctGain: 0,
      })
    }
  }

  return {
    positions,
    updatedAt: {
      cetes:   bonddia?.capturedAt ?? cetes?.capturedAt ?? null,
      gbm:     gbm?.capturedAt ?? null,
      rakuten: rakuten?.capturedAt ?? null,
      td:      Object.values(tdByType)[0]?.capturedAt ?? null,
    },
    sources: {
      hasCetes: !!bonddia || !!cetes,
      hasGbm: !!gbm,
      hasRakuten: !!rakuten,
      hasTd: Object.keys(tdByType).length > 0,
    },
  }
}

// ─── HTML generation ──────────────────────────────────────────────────────────

function fmt(n: number, currency: string): string {
  const locales: Record<string, string> = { CAD: 'en-CA', MXN: 'es-MX', JPY: 'ja-JP' }
  return n.toLocaleString(locales[currency] ?? 'en', {
    style: 'currency', currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  })
}

function sign(n: number): string { return n >= 0 ? '+' : '' }
function pctColor(n: number): string { return n >= 0 ? '#10B981' : '#EF4444' }

function generateHTML(
  positions: Position[],
  updatedAt: Record<string, Date | null>,
  sources: Record<string, boolean>,
  generatedAt: Date,
): string {
  const investable = positions.filter(p => p.cost > 0)
  const byBroker = ['CETESdirecto', 'GBM', 'Rakuten', 'TD Bank']

  const totalsByCurrency: Record<string, { cost: number; current: number }> = {}
  for (const p of investable) {
    if (!totalsByCurrency[p.currency]) totalsByCurrency[p.currency] = { cost: 0, current: 0 }
    totalsByCurrency[p.currency].cost    += p.cost
    totalsByCurrency[p.currency].current += p.current
  }

  const summaryRows = Object.entries(totalsByCurrency).map(([currency, t]) => {
    const gain = t.current - t.cost
    const pct  = t.cost > 0 ? (gain / t.cost) * 100 : 0
    return `<tr>
      <td>${currency}</td>
      <td>${fmt(t.cost, currency)}</td>
      <td>${fmt(t.current, currency)}</td>
      <td style="color:${pctColor(gain)}">${sign(gain)}${fmt(gain, currency)}</td>
      <td style="color:${pctColor(pct)}">${sign(pct)}${pct.toFixed(2)}%</td>
    </tr>`
  }).join('\n')

  const sourceRows = byBroker.map(b => {
    const key = b === 'CETESdirecto' ? 'cetes' : b === 'GBM' ? 'gbm' : b === 'Rakuten' ? 'rakuten' : 'td'
    const hasData = sources[`has${key.charAt(0).toUpperCase() + key.slice(1)}`]
    const date = updatedAt[key]
    const dateStr = date ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
    return `<tr>
      <td>${b}</td>
      <td style="color:${hasData ? '#10B981' : '#EF4444'}">${hasData ? 'Live data' : 'No captures'}</td>
      <td>${dateStr}</td>
    </tr>`
  }).join('\n')

  const positionRows = investable.map(p => {
    const gain = p.current - p.cost
    return `<tr>
      <td>${p.broker}</td>
      <td><strong>${p.ticker}</strong>${p.name ? `<br><small>${p.name}</small>` : ''}</td>
      <td>${p.account}</td>
      <td>${p.category}</td>
      <td>${p.currency}</td>
      <td>${fmt(p.cost, p.currency)}</td>
      <td>${fmt(p.current, p.currency)}</td>
      <td style="color:${pctColor(gain)}">${sign(gain)}${fmt(gain, p.currency)}</td>
      <td style="color:${pctColor(p.pctGain)}"><strong>${sign(p.pctGain)}${p.pctGain.toFixed(2)}%</strong></td>
    </tr>`
  }).join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Moonsto Portfolio Snapshot</title>
  <meta name="description" content="Static snapshot of Arturo's investment portfolio across CETES, GBM, Rakuten and TD Bank. No JavaScript required.">
  <style>
    :root { color-scheme: dark; }
    body { font-family: system-ui, sans-serif; background: #0A0A0F; color: #E2E8F0; margin: 0; padding: 24px; font-size: 14px; }
    h1 { color: #F1F5F9; font-size: 1.5rem; margin-bottom: 4px; }
    h2 { color: #94A3B8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 32px 0 8px; }
    p.meta { color: #64748B; font-size: 12px; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; background: #12121A; border: 1px solid #1E1E2E; border-radius: 8px; overflow: hidden; }
    th { background: #0D0D14; color: #94A3B8; font-size: 11px; font-weight: 500; text-align: left; padding: 8px 12px; border-bottom: 1px solid #1E1E2E; white-space: nowrap; }
    td { padding: 9px 12px; border-bottom: 1px solid #0D0D14; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    small { color: #64748B; font-size: 11px; }
    strong { color: #F1F5F9; }
  </style>
</head>
<body>
  <h1>Moonsto — Portfolio Snapshot</h1>
  <p class="meta">Generated: ${generatedAt.toUTCString()} · Multi-currency investment portfolio (CAD / MXN / JPY)</p>

  <h2>Data sources</h2>
  <table>
    <thead><tr><th>Broker</th><th>Status</th><th>Last capture</th></tr></thead>
    <tbody>${sourceRows}</tbody>
  </table>

  <h2>Totals by currency</h2>
  <table>
    <thead><tr><th>Currency</th><th>Cost basis</th><th>Current value</th><th>Unrealized gain</th><th>% gain</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>All positions (${investable.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Broker</th><th>Ticker</th><th>Account</th><th>Category</th>
        <th>Currency</th><th>Cost basis</th><th>Current value</th>
        <th>Unrealized gain</th><th>% gain</th>
      </tr>
    </thead>
    <tbody>${positionRows}</tbody>
  </table>
</body>
</html>`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const { positions, updatedAt, sources } = await buildPortfolio()
const html = generateHTML(positions, updatedAt, sources, new Date())

const outPath = path.join(process.cwd(), 'public', 'snapshot.html')
fs.writeFileSync(outPath, html, 'utf8')
console.log(`\n✓ ${positions.filter(p => p.cost > 0).length} positions written to public/snapshot.html`)
console.log(`  Sources: CETES=${sources.hasCetes} GBM=${sources.hasGbm} Rakuten=${sources.hasRakuten} TD=${sources.hasTd}`)
