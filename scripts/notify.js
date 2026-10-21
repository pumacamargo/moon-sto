#!/usr/bin/env node
/**
 * Moonsto Investment Reminder
 * Runs on the first and third Mondays of each month, at 21:00 Asia/Tokyo via cron.
 *
 * ETF DCA strategy (Canada VXC/VCN, Japan 2559/2558 — REITs and SOFIPOs excluded):
 *   0% to -10% from ATH  → buy 5% of total gap
 *   -10% to -20%         → buy 10% of total gap
 *   below -20%           → buy 15% of total gap
 */

const TELEGRAM_TOKEN = process.env.MOONSTO_TELEGRAM_TOKEN
const TELEGRAM_CHAT     = '6407630145'
const FIRESTORE_PROJECT = 'moonsto-e2176'

const MXN_CAD = 0.0812
const JPY_CAD = 0.00889
const CAD_JPY = 112.5

// ---------- Plan ----------
const PLAN = [
  {
    group: 'Global Equities',
    category: 'VXC (Global - Canada)',
    location: 'Canada / RRSP·TFSA',
    ticker: 'VXC.TO',
    useDCA: true,
    targetCAD: 65184.51,
    match: p => p.ticker === 'VXC' && ['1','2','3'].includes(p.accountId),
  },
  {
    group: 'Global Equities',
    category: 'MAXIS All Country World Equity ETF 2559',
    location: 'Japan / NISA',
    ticker: '2559.T',
    currency: 'JPY',
    lotSize: 1,
    useDCA: true,
    targetCAD: 21728.17,
    match: p => p.ticker === '2559' && p.accountId === '7',
  },
  {
    group: 'Global Equities',
    category: 'MAXIS S&P 500 US Equity ETF 2558',
    location: 'Japan / NISA',
    ticker: '2558.T',
    currency: 'JPY',
    lotSize: 1,
    useDCA: true,
    targetCAD: 21728.17,
    match: p => p.ticker === '2558' && p.accountId === '7',
  },
  {
    group: 'Global Equities',
    category: 'VCN (Canada)',
    location: 'Canada / RRSP·TFSA',
    ticker: 'VCN.TO',
    useDCA: true,
    targetCAD: 10864.09,
    match: p => p.ticker === 'VCN' && ['1','2','3'].includes(p.accountId),
  },
  {
    group: 'Bonds',
    category: 'CETES',
    location: 'Mexico',
    ticker: null,
    useDCA: false,
    targetCAD: 21728.17,
    match: p => p.ticker === 'CETES',
  },
  {
    group: 'Bonds',
    category: 'Bonddia',
    location: 'Mexico',
    ticker: null,
    useDCA: false,
    targetCAD: 21728.17,
    match: p => p.ticker === 'BONDDIA',
  },
  {
    group: 'Cash',
    category: 'Cash Canada',
    location: 'Canada',
    ticker: null,
    useDCA: false,
    targetCAD: 10864.09,
    match: p => p.category === 'Cash' && ['1','2','3'].includes(p.accountId),
  },
  {
    group: 'REITs / Infrastructure',
    category: 'REITs Mexico',
    location: 'Mexico / GBM',
    ticker: null,
    useDCA: false,
    targetCAD: 21728.17,
    match: p => p.category === 'REITs / Infrastructure' || p.category === 'REITs / InfrastructureM',
  },
  {
    group: 'SOFIPOs',
    category: 'SOFIPOs',
    location: 'Mexico',
    ticker: null,
    useDCA: false,
    targetCAD: 10864.09,
    match: p => p.category === 'SOFIPOs',
  },
  {
    group: 'Gold / Commodities',
    category: 'Gold & Metals',
    location: 'Mexico',
    ticker: null,
    useDCA: false,
    targetCAD: 10864.09,
    match: p => p.category === 'Metals & Commodities',
  },
]

// ---------- DCA ----------
function dcaPct(pctFromATH) {
  if (pctFromATH > -10) return 0.05
  if (pctFromATH > -20) return 0.10
  return 0.15
}

function dcaLabel(pctFromATH) {
  if (pctFromATH > -10) return '5% (near ATH)'
  if (pctFromATH > -20) return '10% (dip -10–20%)'
  return '15% (dip >-20%)'
}

// ---------- Yahoo Finance ----------
async function getPriceAndATH(symbol) {
  try {
    // Current price
    const currentUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`
    const currentRes = await fetch(currentUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const currentData = await currentRes.json()
    const meta = currentData?.chart?.result?.[0]?.meta
    const price = meta?.regularMarketPrice
    const currency = symbol.endsWith('.TO') ? 'CAD' : 'JPY'
    if (!currentRes.ok || meta?.symbol !== symbol || meta?.currency !== currency || !Number.isFinite(price) || price <= 0)
      return { price: null, ath: null }

    // ATH from full monthly history
    const athUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1mo&range=max`
    const athRes = await fetch(athUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const athData = await athRes.json()
    const highs  = athData?.chart?.result?.[0]?.indicators?.quote?.[0]?.high  ?? []
    const closes = athData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const allPrices = [...highs, ...closes].filter(p => p != null && !isNaN(p) && p > 0)
    let ath = athRes.ok && allPrices.length > 0 ? Math.max(...allPrices) : null
    // Yahoo's pre-split Japan highs are not comparable to current JPY unit prices.
    // Without a verified adjustment factor, use the existing 5% fallback instead.
    if (currency === 'JPY' && ath > price * 3) ath = null

    return { price: Number(price), ath }
  } catch {
    return { price: null, ath: null }
  }
}

// ---------- Firestore ----------
async function getLatestSnapshot() {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents:runQuery`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'portfolio_snapshots' }],
        orderBy: [{ field: { fieldPath: 'date' }, direction: 'DESCENDING' }],
        limit: 1,
      },
    }),
  })
  if (!res.ok) throw new Error(`Firestore HTTP ${res.status}; portfolio holdings unavailable`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('Invalid Firestore response; portfolio holdings unavailable')
  const doc = data[0]?.document
  if (!doc) return null
  const f = doc.fields
  const positionValues = f?.positions?.arrayValue?.values
  if (!Array.isArray(positionValues) || !positionValues.every(v => {
    const pf = v?.mapValue?.fields
    const value = pf?.currentValue?.doubleValue ?? pf?.currentValue?.integerValue
    return typeof pf?.ticker?.stringValue === 'string' &&
      typeof pf?.accountId?.stringValue === 'string' &&
      ['CAD', 'MXN', 'JPY'].includes(pf?.currency?.stringValue) &&
      value !== undefined && Number.isFinite(Number(value))
  })) throw new Error('Invalid Firestore positions; portfolio holdings unavailable')
  if (!Number.isFinite(Number(f?.totalCAD?.doubleValue ?? f?.totalCAD?.integerValue)))
    throw new Error('Invalid Firestore total; portfolio holdings unavailable')
  return {
    totalCAD: Number(f.totalCAD?.doubleValue ?? f.totalCAD?.integerValue ?? 0),
    positions: positionValues.map(v => {
      const pf = v.mapValue.fields
      return {
        ticker:       pf.ticker?.stringValue ?? '',
        accountId:    pf.accountId?.stringValue ?? '',
        category:     pf.category?.stringValue ?? '',
        currency:     pf.currency?.stringValue ?? 'CAD',
        currentValue: Number(pf.currentValue?.doubleValue ?? pf.currentValue?.integerValue ?? 0),
      }
    }),
  }
}

// ---------- Telegram ----------
async function sendTelegram(text) {
  let response
  try {
    response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('Telegram transport failed or timed out; delivery is unconfirmed')
  }
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Telegram HTTP ${response.status}: invalid JSON; delivery is unconfirmed`)
  }
  if (!response.ok || data?.ok !== true) {
    const description = String(data?.description ?? 'unknown API error')
      .split(TELEGRAM_TOKEN).join('[REDACTED]')
    throw new Error(`Telegram HTTP ${response.status}, API ${data?.error_code ?? 'unknown'}: ${description}`)
  }
  const messageId = data?.result?.message_id
  const chatId = data?.result?.chat?.id
  if (!Number.isInteger(messageId) || String(chatId) !== String(TELEGRAM_CHAT)) {
    throw new Error('Telegram returned an unexpected message receipt; delivery is unconfirmed')
  }
  console.log(`Telegram accepted: chat_id=${chatId} message_id=${messageId}`)
  return { messageId, chatId }
}

// ---------- Helpers ----------
const fmtCAD = n => '$' + Math.round(n).toLocaleString('en-CA') + ' CAD'
const fmtJPY = n => '¥' + Math.round(n).toLocaleString('en-US') + ' JPY'
const toCAD  = (amount, currency) =>
  currency === 'MXN' ? amount * MXN_CAD : currency === 'JPY' ? amount * JPY_CAD : amount

function isTargetMonday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo", weekday: "short", day: "numeric",
  }).formatToParts(now)
  const weekday = parts.find(p => p.type === "weekday").value
  const day = Number(parts.find(p => p.type === "day").value)
  return weekday === "Mon" && (day <= 7 || (day >= 15 && day <= 21))
}

// ---------- Main ----------
async function main() {
  if (!isTargetMonday()) {
    console.log('Not a target Monday — exiting.')
    process.exit(0)
  }

  const snapshot = await getLatestSnapshot()
  if (!snapshot) {
    await sendTelegram('⚠️ Moonsto: no portfolio snapshot found.')
    return
  }

  // Calculate current value per plan category
  const results = PLAN.map(entry => {
    const currentCAD = snapshot.positions
      .filter(entry.match)
      .reduce((s, p) => s + toCAD(p.currentValue, p.currency), 0)
    return { ...entry, currentCAD }
  })

  // Fetch price + ATH for all unique ETF tickers in parallel
  const etfTickers = [...new Set(results.filter(r => r.useDCA && r.ticker).map(r => r.ticker))]
  const priceData = {}
  await Promise.all(etfTickers.map(async t => {
    priceData[t] = await getPriceAndATH(t)
  }))

  // Build message
  const now       = new Date()
  const dateStr   = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' })
  const tokyoDay = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", day: "numeric" }).format(now))
  const weekLabel = tokyoDay <= 7 ? '1st Monday' : '3rd Monday'

  let msg = `📊 <b>Moonsto · ${weekLabel}</b>\n${dateStr}\n\n`
  msg += `💼 Portfolio: <b>${fmtCAD(snapshot.totalCAD)}</b>\n`
  msg += `─────────────────────\n\n`

  const toBuy   = results.filter(r => r.targetCAD - r.currentCAD > 500)
  const onTrack = results.filter(r => r.targetCAD - r.currentCAD <= 500)

  let lastGroup = ''
  for (const r of toBuy) {
    if (r.group !== lastGroup) {
      msg += `\n<b>${r.group}</b>\n`
      lastGroup = r.group
    }

    const gap     = r.targetCAD - r.currentCAD
    const havePct = r.currentCAD > 0 ? Math.round((r.currentCAD / r.targetCAD) * 100) : 0

    if (r.useDCA && r.ticker && priceData[r.ticker]?.price) {
      const { price, ath } = priceData[r.ticker]
      const pctFromATH = ath ? ((price - ath) / ath) * 100 : null
      const pct        = pctFromATH !== null ? dcaPct(pctFromATH) : 0.05
      const buyCAD     = gap * pct
      const isJapan    = r.currency === 'JPY'
      // JPX ETF listing (issues/01.html): both 2559 and 2558 trade in lots of 1.
      const budget = isJapan ? buyCAD * CAD_JPY : buyCAD
      const units = Math.floor(budget / (price * (r.lotSize ?? 1))) * (r.lotSize ?? 1)
      const cost = units * price

      msg += `  📈 ${r.category} [${r.location}]\n`
      const format = isJapan ? fmtJPY : fmtCAD
      const priceLabel = isJapan ? `¥${price.toLocaleString('en-US')} JPY` : `$${price.toFixed(2)}`
      if (ath && pctFromATH !== null) {
        msg += `  Price: ${priceLabel} · ATH: ${isJapan ? format(ath) : '$' + ath.toFixed(2)} · <b>${pctFromATH.toFixed(1)}% from ATH</b>\n`
        msg += `  DCA: ${dcaLabel(pctFromATH)}\n`
      } else {
        msg += `  Price: ${priceLabel} (ATH unavailable — using 5%)\n`
      }
      msg += `  Gap: ${fmtCAD(gap)} (have ${havePct}%)\n`
      if (isJapan) {
        msg += `  ➡ Buy this time: <b>${units} units = ${format(cost)}</b>\n`
        msg += `  Budget: ${format(budget)} (${fmtCAD(buyCAD)} target gap share)\n\n`
      } else {
        msg += `  ➡ Buy this time: <b>${units} units = ${fmtCAD(buyCAD)}</b>\n\n`
      }

    } else if (r.ticker) {
      msg += `  📈 ${r.category} [${r.location}]\n`
      msg += `  ⚠️ Price unavailable — gap is ${fmtCAD(gap)}\n\n`

    } else {
      msg += `  💵 ${r.category} [${r.location}]\n`
      msg += `  Gap: ${fmtCAD(gap)} (have ${havePct}%)\n`
      msg += `  ➡ Invest: <b>${fmtCAD(gap)}</b>\n\n`
    }
  }

  if (onTrack.length > 0) {
    msg += `✅ <b>On Track:</b>\n`
    for (const r of onTrack) {
      const pct = r.targetCAD > 0 ? Math.round((r.currentCAD / r.targetCAD) * 100) : 100
      msg += `  ${r.category}: ${pct}% · ${fmtCAD(r.currentCAD)}\n`
    }
  }

  console.log(msg)
  await sendTelegram(msg)
  // sendTelegram logs success only after a valid Telegram receipt.
}

main().catch(async err => {
  const message = String(err?.message ?? 'Unknown error').split(TELEGRAM_TOKEN).join('[REDACTED]')
  console.error(`Moonsto notify failed: ${message}`)
  try {
    if (!message.startsWith('Telegram ')) await sendTelegram(`⚠️ Moonsto notify error: ${message}`)
  } catch (alertError) {
    console.error(`Error alert failed: ${String(alertError.message).split(TELEGRAM_TOKEN).join('[REDACTED]')}`)
  }
  process.exitCode = 1
})
