import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Currency, ExchangeRates } from '../types'
import { convert as convertHelper, formatCurrency as formatHelper } from '../lib/currency'
import { mockExchangeRates } from '../lib/mockData'

interface CurrencyContextValue {
  displayCurrency: Currency
  setDisplayCurrency: (c: Currency) => void
  rates: ExchangeRates
  convert: (value: number, fromCurrency: Currency) => number
  format: (value: number, currency: Currency) => string
  formatDisplay: (value: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('CAD')
  const rates = mockExchangeRates

  function convert(value: number, fromCurrency: Currency): number {
    return convertHelper(value, fromCurrency, displayCurrency, rates)
  }

  function format(value: number, currency: Currency): string {
    return formatHelper(value, currency)
  }

  function formatDisplay(value: number): string {
    return formatHelper(value, displayCurrency)
  }

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, rates, convert, format, formatDisplay }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be inside CurrencyProvider')
  return ctx
}
