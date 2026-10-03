export type Currency = 'CAD' | 'MXN' | 'JPY'
export type Location = 'Canada' | 'Mexico' | 'Japan'

export interface Account {
  id: string
  name: string
  location: Location
  currency: Currency
}

export interface Position {
  id: string
  accountId: string
  ticker: string
  name?: string
  category: string
  subCategory?: string
  value: number
  currentValue: number
  currency: Currency
  pctGain: number
  lastUpdated: Date
}

export interface PlannedCategory {
  id: string
  groupId: string
  location: Location
  category: string
  targetPct: number
  currentPct: number
  targetValue: number
  currentValue: number
  netPnl?: number
}

export interface PlannedGroup {
  id: string
  name: string
  targetPct: number
  categories: PlannedCategory[]
}

export interface Transfer {
  id: string
  date: Date
  from: string
  to: string
  sentAmount: number
  sentCurrency: Currency
  exchangeRate: number
  arriveAmount: number
  arriveCurrency: Currency
  arriveInCAD: number
  commissionCAD: number
  difference: number
}

export interface ExchangeRates {
  CAD_MXN: number
  CAD_JPY: number
  MXN_CAD: number
  JPY_CAD: number
  MXN_JPY: number
  JPY_MXN: number
  updatedAt: Date
}
