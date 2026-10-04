// Parses innerText captures from appgbm.com portfolio pages.
// One capture type: the main account page (trading/MEX/{accountId}).
// Challenge: GBM renders table numbers digit-by-digit in separate DOM spans,
// so innerText produces one character per line — requires normalization first.

export interface GbmPosition {
  ticker: string
  titulos: number
  costoProm: number
  impXCto: number      // total cost basis
  precioMerc: number
  valorMerc: number    // current value
  plusMinus: number
  varHistPct: number
  varDiaPct: number
  pctCartera: number
  seccion: 'capitales' | 'reporto'
}

export interface GbmCapture {
  type: 'gbm_portfolio'
  capturedAt: Date
  accountId: string
  valorActual: number
  rendHoyPct: number
  rendHoy: number
  rendMesPct: number
  rendMes: number
  rendAnioPct: number
  rendAnio: number
  rendHistoricoPct: number
  rendHistorico: number
  fechaOrigen: string   // e.g. "06 FEB 2026"
  disponible: number
  liquidez: number
  posiciones: GbmPosition[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  return parseFloat((s || '').replace(/[$,MXN\s]/g, '').replace('%', '')) || 0
}

// GBM renders each digit as a separate DOM node → each char ends up on its own line.
// This collapses sequences of single-char lines (digits, $, -, +, ,, ., %) into full numbers.
function normalizeNumbers(text: string): string {
  const lines = text.split('\n').map(l => l.trim())
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line === '') { i++; continue }

    if (/^[\d$\-+,.]$/.test(line) || line === '%') {
      let acc = line
      i++
      while (i < lines.length) {
        const next = lines[i].trim()
        if (/^[\d$\-+,.]$/.test(next) || next === '%' || next === '') {
          if (next !== '') acc += next
          i++
        } else break
      }
      result.push(acc)
    } else {
      result.push(line)
      i++
    }
  }

  return result.filter(Boolean).join('\n')
}

function extractAfterLabel(lines: string[], label: string): string {
  const idx = lines.findIndex(l => l === label || l.startsWith(label))
  if (idx < 0) return ''
  return lines.slice(idx + 1, idx + 5).find(Boolean) ?? ''
}

function extractRendimiento(lines: string[], label: string): { pct: number; amount: number } {
  const idx = lines.findIndex(l => l === label)
  if (idx < 0) return { pct: 0, amount: 0 }
  const nonEmpty = lines.slice(idx + 1, idx + 6).filter(Boolean)
  return { pct: parseNum(nonEmpty[0]), amount: parseNum(nonEmpty[1]) }
}

// ─── detection ───────────────────────────────────────────────────────────────

export function detectGbmCapture(text: string): boolean {
  return text.includes('Trading MX') &&
    text.includes('Valor actual') &&
    text.includes('Rendimiento histórico')
}

// ─── parser ──────────────────────────────────────────────────────────────────

const COL_HEADERS = new Set([
  'Emisora', 'Títulos', 'Cto. Prom.', 'Imp. X Cto.', 'Precio Merc.',
  'Valor Merc.', 'Plus/Minus', '% Var. Hist.', '% Var. Dia', '% Cartera',
])

const SKIP_LINES = new Set([
  'Plus', 'Home', 'Advisory', 'Market', 'Trading', 'Ayuda',
  'Trading MX', 'Trading USA', 'Al cierre del dia', 'Mi portafolio',
  'Mismo dia', 'Mayor a 48h', 'Total',
  'Este saldo forma parte de tu valor actual.',
  'Market abierto de Lunes a Viernes - 07:00 a 14:00 h',
])

const SECTION_RE = /^[\d.]+%\s+(Mercado de Capitales Nacional|Valores en Reporto|Liquidez)/

export function parseGbm(text: string, capturedAt: Date): GbmCapture | null {
  if (!detectGbmCapture(text)) return null

  const normalized = normalizeNumbers(text)
  const lines = normalized.split('\n').filter(Boolean)

  // Account ID
  const idMatch = normalized.match(/ID:\s*([A-Z0-9]+)/)
  const accountId = idMatch ? idMatch[1] : ''

  // Summary
  const valorActual = parseNum(extractAfterLabel(lines, 'Valor actual'))
  const rendHoy  = extractRendimiento(lines, 'Rendimiento de hoy')
  const rendMes  = extractRendimiento(lines, 'Rendimiento del mes')
  const rendAnio = extractRendimiento(lines, 'Rendimiento del año')
  const rendHist = extractRendimiento(lines, 'Rendimiento histórico')

  // Origin date "DD MMM YYYY"
  const dateMatch = normalized.match(/(\d{2}\s+[A-Z]{3}\s+\d{4})/)
  const fechaOrigen = dateMatch ? dateMatch[1] : ''

  // Available cash
  const dispIdx = lines.findIndex(l => l.includes('Disponible para comprar'))
  let disponible = 0
  if (dispIdx >= 0) {
    const after = lines.slice(dispIdx + 1, dispIdx + 5).filter(Boolean)
    disponible = parseNum(after.find(l => l.startsWith('$')) ?? after[0] ?? '')
  }

  // Liquidez total
  const totalIdx = lines.findIndex(l => l === 'Total')
  const liquidez = totalIdx >= 0 ? parseNum(lines[totalIdx + 1] ?? '') : 0

  // Positions
  const posiciones: GbmPosition[] = []
  type Seccion = 'capitales' | 'reporto' | 'liquidez'
  let seccion: Seccion | null = null

  const portfolioIdx = lines.findIndex(l => l === 'Mi portafolio')
  let i = portfolioIdx >= 0 ? portfolioIdx + 1 : 0

  while (i < lines.length) {
    const line = lines[i]

    // Section header
    const sectionMatch = line.match(/^[\d.]+%\s+(Mercado de Capitales Nacional|Valores en Reporto|Liquidez)/)
    if (sectionMatch) {
      const name = sectionMatch[1]
      seccion = name === 'Mercado de Capitales Nacional' ? 'capitales'
              : name === 'Valores en Reporto'           ? 'reporto'
              : 'liquidez'
      i++; continue
    }

    if (COL_HEADERS.has(line) || seccion === 'liquidez') { i++; continue }

    if (['Órdenes', 'Transacciones', 'Movimientos', 'Dividendos'].includes(line)) break

    // Ticker: has letters, not a known skip/header line, not a pure number
    const isTicker = /[A-Za-z]/.test(line) &&
      !SECTION_RE.test(line) &&
      !COL_HEADERS.has(line) &&
      !SKIP_LINES.has(line) &&
      !/^(Disponible|Transferir|Depositar|Aún|Rendimiento|Valor|ID:)/.test(line) &&
      seccion !== null && (seccion === 'capitales' || seccion === 'reporto')

    if (isTicker) {
      const vals: number[] = []
      let j = i + 1
      while (j < lines.length && vals.length < 9) {
        const v = lines[j]
        if (COL_HEADERS.has(v) || SECTION_RE.test(v)) break
        vals.push(parseNum(v))
        j++
      }

      if (vals.length >= 7) {
        posiciones.push({
          ticker:     line,
          titulos:    vals[0],
          costoProm:  vals[1],
          impXCto:    vals[2],
          precioMerc: vals[3],
          valorMerc:  vals[4],
          plusMinus:  vals[5],
          varHistPct: vals[6],
          varDiaPct:  vals[7] ?? 0,
          pctCartera: vals[8] ?? 0,
          seccion:    seccion as Exclude<Seccion, 'liquidez'>,
        })
        i = j; continue
      }
    }

    i++
  }

  return {
    type: 'gbm_portfolio',
    capturedAt,
    accountId,
    valorActual,
    rendHoyPct:       rendHoy.pct,
    rendHoy:          rendHoy.amount,
    rendMesPct:       rendMes.pct,
    rendMes:          rendMes.amount,
    rendAnioPct:      rendAnio.pct,
    rendAnio:         rendAnio.amount,
    rendHistoricoPct: rendHist.pct,
    rendHistorico:    rendHist.amount,
    fechaOrigen,
    disponible,
    liquidez,
    posiciones,
  }
}
