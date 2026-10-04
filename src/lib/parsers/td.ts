// Parses innerText captures from TD Direct Investing pages saved via Chrome Extension.
// Account types: RRSP (SDRSP), TFSA (SDTFSA), Cash.
// All monetary values in the capture are in CAD (USD positions are auto-converted by TD).

export interface TdPosition {
  ticker: string
  name: string
  quantity: number
  priceCurrency: 'CAD' | 'USD'
  price: number         // in native currency (price column)
  avgCost: number       // in CAD (TD converts USD positions)
  marketValue: number   // in CAD
  bookCost: number      // in CAD
  unrealizedGain: number
  unrealizedPct: number
  portfolioPct: number
}

export interface TdCapture {
  type: 'td_portfolio'
  capturedAt: Date
  accountId: string
  accountType: 'RRSP' | 'TFSA' | 'Cash'
  totalValue: number
  cashBalance: number
  investments: number
  positions: TdPosition[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

// TD appends superscript footnote digits (1–4) to some numeric values in innerText.
// Strip them: only if the value has 3+ decimal places and ends in [1-4].
function stripFootnote(s: string): number {
  const n = s.replace(/[$,]/g, '')
  const dot = n.indexOf('.')
  if (dot >= 0 && n.length - dot > 3 && /[1-4]$/.test(n)) {
    return parseFloat(n.slice(0, -1)) || 0
  }
  return parseFloat(n) || 0
}

function parseGain(s: string): number {
  if (!s || s.includes('N/A') || s === '—') return 0
  const sign = s.startsWith('-') ? -1 : 1
  return sign * (parseFloat(s.replace(/[^0-9.]/g, '')) || 0)
}

function parsePct(s: string): number {
  if (!s || s.includes('N/A') || s === '—') return 0
  const sign = s.startsWith('-') ? -1 : 1
  return sign * (parseFloat(s.replace(/[^0-9.]/g, '')) || 0)
}

// ─── detection ───────────────────────────────────────────────────────────────

export function detectTdCapture(text: string): boolean {
  return (text.includes('TD Direct Investing') && text.includes('Book Cost')) ||
         (text.includes('Currently ViewingTD') && text.includes('Current Balance'))
}

// ─── parser ──────────────────────────────────────────────────────────────────

export function parseTdCapture(text: string, capturedAt: Date): TdCapture | null {
  const t = text.replace(/\xa0/g, ' ')
  if (!detectTdCapture(t)) return null

  // TD EasyWeb bank account (savings/checking) — "Currently ViewingTD - Emergency Cash\n6618210"
  if (t.includes('Currently ViewingTD') && !t.includes('TD Direct Investing')) {
    const numMatch  = t.match(/Currently ViewingTD[^\n]*\n(\d+)/)
    const balance   = stripFootnote((t.match(/Current Balance\n\$([0-9,.]+)/))?.[1] ?? '0')
    return {
      type: 'td_portfolio',
      capturedAt,
      accountId:    numMatch?.[1] ?? '',
      accountType:  'Cash',
      totalValue:   balance,
      cashBalance:  balance,
      investments:  0,
      positions:    [],
    }
  }

  // TD Direct Investing brokerage account
  const accMatch = t.match(/TD Direct Investing[–\-]([A-Z0-9]+)[–\-]([^\n]+)/)
  const accountId = accMatch?.[1] ?? ''
  const accDesc   = (accMatch?.[2] ?? '').toUpperCase()
  const accountType: TdCapture['accountType'] =
    accDesc.includes('SDRSP') || accDesc.includes('RRSP') ? 'RRSP' :
    accDesc.includes('TFSA')                               ? 'TFSA' : 'Cash'

  const totalValue  = stripFootnote((t.match(/Total Value\n\$([0-9,.]+)/))?.[1]  ?? '0')
  const cashBalance = stripFootnote((t.match(/Cash Balance\n\$([0-9,.]+)/))?.[1] ?? '0')
  const investments = stripFootnote((t.match(/Investments\n\$([0-9,.]+)/))?.[1]  ?? '0')

  // Positions — each block:
  //   TICKER\nFULL NAME\nBuy\nSell\nQTY\n$PRICE[footnote]\n[(USD)\n]$AVGCOST[f]\n$MKTVAL[f]\n$BOOKCOST\nGAIN\nGAIN%\nPORTFOLIO%
  const blockRE = /([A-Z]+)\n([^\n]+)\nBuy\nSell\n([\d,]+)\n\$([0-9,.]+)\n(\(USD\)\n)?\$([0-9,.]+)\n\$([0-9,.]+)\n\$([0-9,.]+)\n([+\-]?\$?[0-9,.]+|N\/A\d*)\n([+\-]?[0-9.]+%|N\/A\d*)\n([0-9.]+%)/g

  const positions: TdPosition[] = []
  let m: RegExpExecArray | null
  while ((m = blockRE.exec(t)) !== null) {
    positions.push({
      ticker:         m[1],
      name:           m[2].trim(),
      quantity:       parseInt(m[3].replace(/,/g, ''), 10) || 0,
      priceCurrency:  m[5] ? 'USD' : 'CAD',
      price:          stripFootnote(m[4]),
      avgCost:        stripFootnote(m[6]),
      marketValue:    stripFootnote(m[7]),
      bookCost:       stripFootnote(m[8]),
      unrealizedGain: parseGain(m[9]),
      unrealizedPct:  parsePct(m[10]),
      portfolioPct:   parsePct(m[11]),
    })
  }

  return { type: 'td_portfolio', capturedAt, accountId, accountType, totalValue, cashBalance, investments, positions }
}
