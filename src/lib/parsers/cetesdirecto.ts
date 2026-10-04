// Parses innerText captures from cetesdirecto.com pages saved via Chrome Extension.
// Three capture types:
//   bonddia  — Portafolio → click "BONDDIA"
//   cetes    — Portafolio → click "CETES"
//   deposit  — Movimientos → Ingresos de efectivo (one capture per month)

export interface BonddiaCapture {
  type: 'bonddia'
  capturedAt: Date
  montoValuado: number
  titulos: number
  tasaCompra: number
  montoDisponible: number
  montoInvertido: number
  precioMercado: number
  plusvalia: number
  fechaInversion: string
  fechaVencimiento: string
}

export interface CetesPosition {
  serie: string
  plazo: string
  precioAdquisicion: number
  titulos: number
  tasaCompra: number
  montoInvertido: number
  montoValuado: number
}

export interface CetesCapture {
  type: 'cetes'
  capturedAt: Date
  montoValuadoTotal: number
  titulosTotal: number
  tasaPromedio: number
  posiciones: CetesPosition[]
}

export interface DepositEntry {
  fecha: string
  tipo: string
  importeOriginal: number
  importeIngresado: number
}

export interface DepositCapture {
  type: 'deposit'
  capturedAt: Date
  mes: string
  depositos: DepositEntry[]
  total: number
}

export type CetesDirectoCapture = BonddiaCapture | CetesCapture | DepositCapture

// ─── helpers ────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  return parseFloat((s || '').replace(/,/g, '').replace('%', '')) || 0
}

// Extracts value from "Label:\tVALUE" lines. Handles footnote prefix digits (e.g. "1Tasa de compra:").
function extractTabValue(text: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp('\\d?' + escaped + '\\t([^\\n]+)'))
  return match ? match[1].trim() : ''
}

// ─── type detection ──────────────────────────────────────────────────────────

export function detectCaptureType(text: string): 'bonddia' | 'cetes' | 'deposit' | null {
  if (text.includes('Precio de mercado:') && text.includes('Plusvalía/minusvalía:')) return 'bonddia'
  if (text.includes('Serie:') && text.includes('Posición en CETES')) return 'cetes'
  if (text.includes('Ingresos de efectivo') && text.includes('Importe ingresado')) return 'deposit'
  return null
}

// ─── parsers ─────────────────────────────────────────────────────────────────

function parseBonddia(text: string, capturedAt: Date): BonddiaCapture {
  return {
    type: 'bonddia',
    capturedAt,
    montoValuado:    parseNum(extractTabValue(text, 'Monto valuado:')),
    titulos:         parseNum(extractTabValue(text, 'Títulos:')),
    tasaCompra:      parseNum(extractTabValue(text, 'Tasa de compra:')),
    montoDisponible: parseNum(extractTabValue(text, 'Monto disponible:')),
    montoInvertido:  parseNum(extractTabValue(text, 'Monto invertido:')),
    precioMercado:   parseNum(extractTabValue(text, 'Precio de mercado:')),
    plusvalia:       parseNum(extractTabValue(text, 'Plusvalía/minusvalía:')),
    fechaInversion:  extractTabValue(text, 'Fecha de inversión:'),
    fechaVencimiento: extractTabValue(text, 'Fecha de vencimiento:'),
  }
}

function parseCetes(text: string, capturedAt: Date): CetesCapture {
  const parts = text.split('Posición en CETES')
  const headerLines = parts[0].split('\n')

  let montoValuadoTotal = 0
  let titulosTotal = 0
  let tasaPromedio = 0

  for (const line of headerLines) {
    if (line.includes('Monto valuado:\t'))   montoValuadoTotal = parseNum(line.split('\t')[1])
    if (line.match(/^Títulos:\t/))           titulosTotal = parseNum(line.split('\t')[1])
    if (line.match(/\d?Tasa de compra:\t/))  tasaPromedio = parseNum(line.split('\t')[1])
  }

  const posiciones: CetesPosition[] = parts.slice(1).map(block => {
    const pos: Partial<CetesPosition> = {}
    for (const line of block.split('\n')) {
      if (line.includes('Serie:\t'))               pos.serie = line.split('\t')[1]?.trim()
      if (line.includes('Plazo:\t'))               pos.plazo = line.split('\t')[1]?.trim()
      if (line.includes('Precio de adquisición:\t')) pos.precioAdquisicion = parseNum(line.split('\t')[1])
      if (line.includes('Títulos:\t'))             pos.titulos = parseNum(line.split('\t')[1])
      if (line.includes('Tasa de compra:\t'))      pos.tasaCompra = parseNum(line.split('\t')[1])
      if (line.includes('Monto invertido:\t'))     pos.montoInvertido = parseNum(line.split('\t')[1])
      if (line.includes('Monto valuado:\t'))       pos.montoValuado = parseNum(line.split('\t')[1])
    }
    return pos as CetesPosition
  }).filter(p => !!p.serie)

  return { type: 'cetes', capturedAt, montoValuadoTotal, titulosTotal, tasaPromedio, posiciones }
}

function parseDeposit(text: string, capturedAt: Date): DepositCapture {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const mesMatch = text.match(/([A-ZÁÉÍÓÚ]+\/\d{4})/)
  const mes = mesMatch ? mesMatch[1] : ''

  const totalIdx = lines.findIndex(l => l.includes('Monto total de ingresos en el periodo'))
  const total = totalIdx >= 0 ? parseNum(lines[totalIdx + 1] || '0') : 0

  const datePattern = /^\d{2}\/\d{2}\/\d{4}$/
  const depositos: DepositEntry[] = []

  for (let i = 0; i < lines.length; i++) {
    if (datePattern.test(lines[i])) {
      depositos.push({
        fecha:           lines[i],
        tipo:            lines[i + 1] || '',
        importeOriginal: parseNum(lines[i + 2] || '0'),
        importeIngresado: parseNum(lines[i + 4] || '0'),
      })
    }
  }

  return { type: 'deposit', capturedAt, mes, depositos, total }
}

// ─── public API ──────────────────────────────────────────────────────────────

export function parseCetesDirectoCapture(
  text: string,
  capturedAt: Date,
): CetesDirectoCapture | null {
  const type = detectCaptureType(text)
  if (type === 'bonddia') return parseBonddia(text, capturedAt)
  if (type === 'cetes')   return parseCetes(text, capturedAt)
  if (type === 'deposit') return parseDeposit(text, capturedAt)
  return null
}
