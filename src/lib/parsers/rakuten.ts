// Parses innerText captures from member.rakuten-sec.co.jp/app/ass_all_possess_lst
// (List of owned items — all). One capture per update, contains positions + exchange rates.

export interface RakutenPosition {
  tickerCode: string    // e.g. "6758"
  name: string          // e.g. "Sony Group"
  accountType: string   // e.g. "NISA Growth Investment Program"
  quantity: number
  avgCost: number       // per share
  costBasis: number     // quantity × avgCost
  currentPrice: number  // per share
  marketValue: number
  unrealizedPnL: number
  pctGain: number
}

export interface RakutenExchangeRates {
  usdJpy: number
  cadJpy: number
  eurJpy: number
}

export interface RakutenCapture {
  type: 'rakuten_portfolio'
  capturedAt: Date
  totalAssets: number
  cashJpy: number
  totalDeposits: number    // uninvested cash/deposits
  totalHeldValue: number   // market value of positions
  posiciones: RakutenPosition[]
  exchangeRates: RakutenExchangeRates
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseYen(s: string): number {
  return parseFloat((s || '').replace(/[¥,\s]/g, '').replace(' yen', '').replace('yen', '')) || 0
}

function extractYenAfter(lines: string[], label: string): number {
  const idx = lines.findIndex(l => l.startsWith(label))
  if (idx < 0) return 0
  const match = lines[idx].match(/([\d,]+)\s*yen/)
  return match ? parseYen(match[1]) : 0
}

// ─── detection ───────────────────────────────────────────────────────────────

export function detectRakutenCapture(text: string): boolean {
  return text.includes('rakuten-sec') || (
    text.includes('Total Assets') &&
    text.includes('Unrealized gains and losses') &&
    text.includes('Average acquisition cost')
  )
}

// ─── parser ──────────────────────────────────────────────────────────────────

export function parseRakuten(text: string, capturedAt: Date): RakutenCapture | null {
  if (!detectRakutenCapture(text)) return null

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Summary totals
  const totalAssets     = extractYenAfter(lines, 'Total Assets')
  const totalHeldValue  = extractYenAfter(lines, 'Total value of held assets')
  // "Total deposits" label line has no value; the yen amount is on the next line
  // ("→ Account details  → Deposit and withdrawal history\t850,450 yen").
  // NOTE: "Japanese Yen" is the dividends/interest column, NOT cash.
  const totalDeposits   = (() => {
    const idx = lines.findIndex(l => l.startsWith('Total deposits'))
    if (idx < 0) return 0
    for (const l of lines.slice(idx, idx + 2)) {
      const m = l.match(/([\d,]+)\s*yen/)
      if (m) return parseYen(m[1])
    }
    return 0
  })()
  const cashJpy         = totalDeposits

  // Exchange rates — lines like "USD\t157.88 yen / USD (..."
  const rateMatch = (currency: string): number => {
    const line = lines.find(l => l.startsWith(currency + '\t') || l.startsWith(currency + ' '))
    if (!line) return 0
    const m = line.match(/([\d.]+)\s*yen/)
    return m ? parseFloat(m[1]) : 0
  }
  const exchangeRates: RakutenExchangeRates = {
    usdJpy: rateMatch('USD'),
    cadJpy: rateMatch('Canadian dollar'),
    eurJpy: rateMatch('EUR'),
  }

  // Positions — each block starts with "Domestic stocks\t{code}"
  // Structure per position:
  //   "Domestic stocks\t6758"
  //   "Sony Group"
  //   "NISA Growth Investment Program\t15KK\t3,474.00 yen"
  //   "3,753.0 yen"          ← current price
  //   "-34.0 yen"            ← price change (skip)
  //   "56,295 yen"           ← market value
  //   "+4,185 yen"           ← unrealized P&L

  const posiciones: RakutenPosition[] = []
  const fullText = lines.join('\n')

  // Match each "Domestic stocks\t{ticker}" block
  const blockRE = /Domestic stocks\t(\d+)\n([^\n]+)\n([^\n]*NISA[^\n]*)\n([\d,.]+) yen\n([+\-]?[\d,.]+) yen\n\n?([\d,]+) yen\n([+\-][\d,]+ yen)/g
  let m: RegExpExecArray | null

  while ((m = blockRE.exec(fullText)) !== null) {
    const tickerCode  = m[1]
    const name        = m[2].trim()
    const metaLine    = m[3]
    const currentPriceStr = m[4]
    // m[5] = price change (skip)
    const marketValueStr = m[6]
    const unrealizedStr  = m[7]

    // Parse meta line: "NISA Growth Investment Program\t15KK\t3,474.00 yen"
    const metaParts = metaLine.split('\t').map(p => p.trim()).filter(Boolean)
    const accountType = metaParts[0] || ''
    const quantityStr = metaParts[1] || ''
    const avgCostStr  = metaParts[2] || ''

    const quantity     = parseInt(quantityStr.replace(/KK|[^\d]/g, '')) || 0
    const avgCost      = parseYen(avgCostStr)
    const currentPrice = parseFloat(currentPriceStr.replace(/,/g, '')) || 0
    const marketValue  = parseYen(marketValueStr)
    const unrealizedPnL = parseYen(unrealizedStr)
    const costBasis    = quantity * avgCost
    const pctGain      = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

    posiciones.push({
      tickerCode, name, accountType, quantity,
      avgCost, costBasis, currentPrice, marketValue, unrealizedPnL, pctGain,
    })
  }

  // Fallback: if regex didn't match (page format variation), try line-by-line
  if (posiciones.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.startsWith('Domestic stocks\t')) continue

      const tickerCode  = line.split('\t')[1]?.trim() || ''
      const name        = lines[i + 1]?.trim() || ''
      const metaLine    = lines[i + 2] || ''
      const metaParts   = metaLine.split('\t').map(p => p.trim()).filter(Boolean)
      const accountType = metaParts[0] || ''
      const quantityStr = metaParts[1] || ''
      const avgCostStr  = metaParts[2] || ''

      const quantity  = parseInt(quantityStr.replace(/KK|[^\d]/g, '')) || 0
      const avgCost   = parseYen(avgCostStr)
      const costBasis = quantity * avgCost

      // Find market value and unrealized P&L in next ~8 lines
      let marketValue  = 0
      let unrealizedPnL = 0
      let yenCount = 0
      for (let j = i + 3; j < Math.min(i + 12, lines.length); j++) {
        const v = lines[j]
        if (/^[\d,]+ yen$/.test(v) && yenCount === 0) { marketValue = parseYen(v); yenCount++ }
        else if (/^[+\-][\d,]+ yen$/.test(v)) {
          unrealizedPnL = parseYen(v)  // parseYen already keeps the sign
          break
        }
      }

      const currentPrice = costBasis > 0 ? 0 : 0
      const pctGain = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

      if (tickerCode && quantity > 0) {
        posiciones.push({
          tickerCode, name, accountType, quantity,
          avgCost, costBasis, currentPrice, marketValue, unrealizedPnL, pctGain,
        })
      }
    }
  }

  return {
    type: 'rakuten_portfolio',
    capturedAt,
    totalAssets,
    cashJpy,
    totalDeposits,
    totalHeldValue,
    posiciones,
    exchangeRates,
  }
}
