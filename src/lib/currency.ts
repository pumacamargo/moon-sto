import type { Currency, ExchangeRates } from '../types'

export function convert(value: number, from: Currency, to: Currency, rates: ExchangeRates): number {
  if (from === to) return value

  const key = `${from}_${to}` as keyof ExchangeRates
  if (key in rates && key !== 'updatedAt') {
    return value * (rates[key] as number)
  }

  // Two-step conversion through CAD
  const toCAD = `${from}_CAD` as keyof ExchangeRates
  const fromCAD = `CAD_${to}` as keyof ExchangeRates

  if (from === 'CAD') {
    const rate = rates[fromCAD as keyof ExchangeRates] as number
    return value * rate
  }
  if (to === 'CAD') {
    const rate = rates[toCAD as keyof ExchangeRates] as number
    return value * rate
  }

  const inCAD = value * (rates[toCAD as keyof ExchangeRates] as number)
  return inCAD * (rates[fromCAD as keyof ExchangeRates] as number)
}

export function formatCurrency(value: number, currency: Currency): string {
  if (currency === 'JPY') {
    return `¥${Math.round(value).toLocaleString('en-CA')} JPY`
  }
  const formatted = value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `$${formatted} ${currency}`
}
