import { useMemo } from 'react'
import { mockPositions } from '../lib/mockData'
import { useCetesDirecto } from './useCetesDirecto'
import { useGbm } from './useGbm'
import { useRakuten } from './useRakuten'
import { useTd } from './useTd'
import type { Position } from '../types'

export const CETES_MOCK_IDS   = new Set(['11', '14'])
export const GBM_MOCK_IDS     = new Set(['12', '13'])
export const RAKUTEN_MOCK_IDS = new Set(['15', '16', '17'])

export const TD_ACCOUNT_IDS: Record<string, string> = { RRSP: '1', TFSA: '2', Cash: '3' }

export const TD_CATEGORIES: Record<string, string> = {
  KILO: 'Metals & Commodities', SBT: 'Metals & Commodities',
  UEC:  'Metals & Commodities', IAU: 'Metals & Commodities',
  MSFT: 'Productive Assets US', CIBR: 'Productive Assets US',
  QS:   'Productive Assets US', UBI:  'Productive Assets US',
  U:    'Productive Assets US',
}
export const TD_SUBCATEGORIES: Record<string, string> = { UBI: 'Lottery', U: 'Lottery' }

export interface BrokerStaleInfo {
  loading: boolean
  isStale: boolean
  lastUpdated: Date | null
}

export interface AllPositionsResult {
  positions: Position[]
  loading: boolean
  cetes: BrokerStaleInfo
  gbm: BrokerStaleInfo
  rakuten: BrokerStaleInfo
  td: BrokerStaleInfo
}

export function useAllPositions(): AllPositionsResult {
  const cetesData   = useCetesDirecto()
  const gbmData     = useGbm()
  const rakutenData = useRakuten()
  const tdData      = useTd()

  const loading = cetesData.loading || gbmData.loading || rakutenData.loading || tdData.loading

  const cetesPositions = useMemo<Position[]>(() => {
    const positions: Position[] = []
    const now = cetesData.bonddia?.capturedAt ?? cetesData.cetes?.capturedAt ?? new Date()

    if (cetesData.bonddia) {
      const b = cetesData.bonddia
      const costBasis = b.montoValuado - b.plusvalia
      positions.push({
        id: 'cetes-bonddia', accountId: '4',
        ticker: 'BONDDIA', name: 'Bonddia', category: 'Bonddia',
        value: costBasis, currentValue: b.montoValuado, currency: 'MXN',
        pctGain: costBasis > 0 ? (b.plusvalia / costBasis) * 100 : 0,
        lastUpdated: now,
      })
    }

    if (cetesData.cetes) {
      const bonddiaCost = cetesData.bonddia
        ? cetesData.bonddia.montoValuado - cetesData.bonddia.plusvalia : 0
      const cetesOriginalTotal = cetesData.totalDeposited > 0 && bonddiaCost > 0
        ? cetesData.totalDeposited - bonddiaCost : 0
      const totalMontoInv = cetesData.cetes.posiciones.reduce((s, p) => s + p.montoInvertido, 0)

      cetesData.cetes.posiciones.forEach(pos => {
        const origCost = cetesOriginalTotal > 0 && totalMontoInv > 0
          ? cetesOriginalTotal * (pos.montoInvertido / totalMontoInv)
          : pos.montoInvertido
        positions.push({
          id: `cetes-${pos.serie}`, accountId: '6',
          ticker: 'CETES', name: `CETES ${pos.serie}`, category: 'Cetes',
          subCategory: `${pos.plazo} · ${pos.tasaCompra}%`,
          value: origCost, currentValue: pos.montoValuado, currency: 'MXN',
          pctGain: origCost > 0 ? ((pos.montoValuado - origCost) / origCost) * 100 : 0,
          lastUpdated: now,
        })
      })
    }

    return positions
  }, [cetesData])

  const gbmPositions = useMemo<Position[]>(() => {
    if (!gbmData.capture) return []
    const now = gbmData.capture.capturedAt
    return gbmData.capture.posiciones.map(pos => ({
      id:           `gbm-${pos.ticker.replace(/\s/g, '-')}`,
      accountId:    '5',
      ticker:       pos.ticker,
      category:     pos.seccion === 'capitales' ? 'REITs / InfrastructureM' : 'Reporto',
      value:        pos.impXCto,
      currentValue: pos.valorMerc,
      currency:     'MXN' as const,
      pctGain:      pos.varHistPct,
      lastUpdated:  now,
    }))
  }, [gbmData])

  const rakutenPositions = useMemo<Position[]>(() => {
    if (!rakutenData.capture) return []
    const now = rakutenData.capture.capturedAt
    const positions: Position[] = rakutenData.capture.posiciones.map(pos => ({
      id:           `rakuten-${pos.tickerCode}`,
      accountId:    '7',
      ticker:       pos.tickerCode,
      name:         pos.name,
      category:     'Productive Assets JP',
      value:        pos.costBasis,
      currentValue: pos.marketValue,
      currency:     'JPY' as const,
      pctGain:      pos.pctGain,
      lastUpdated:  now,
    }))
    if (rakutenData.capture.cashJpy > 0) {
      positions.push({
        id: 'rakuten-cash', accountId: '7',
        ticker: 'JPY', name: 'Cash', category: 'Cash',
        value: rakutenData.capture.cashJpy,
        currentValue: rakutenData.capture.cashJpy,
        currency: 'JPY' as const,
        pctGain: 0,
        lastUpdated: now,
      })
    }
    return positions
  }, [rakutenData])

  const tdPositions = useMemo<Position[]>(() => {
    const positions: Position[] = []
    for (const capture of tdData.captures) {
      const accountId = TD_ACCOUNT_IDS[capture.accountType] ?? '1'
      const now = capture.capturedAt
      for (const pos of capture.positions) {
        positions.push({
          id:           `td-${capture.accountId}-${pos.ticker}`,
          accountId,
          ticker:       pos.ticker,
          name:         pos.name,
          category:     TD_CATEGORIES[pos.ticker] ?? 'Productive Assets US',
          subCategory:  TD_SUBCATEGORIES[pos.ticker],
          value:        pos.bookCost,
          currentValue: pos.marketValue,
          currency:     'CAD' as const,
          pctGain:      pos.unrealizedPct,
          lastUpdated:  now,
        })
      }
      if (capture.cashBalance > 0) {
        positions.push({
          id:           `td-${capture.accountId}-cash`,
          accountId,
          ticker:       'CAD', name: 'Cash', category: 'Cash',
          value:        capture.cashBalance,
          currentValue: capture.cashBalance,
          currency:     'CAD' as const,
          pctGain:      0,
          lastUpdated:  capture.capturedAt,
        })
      }
    }
    return positions
  }, [tdData.captures])

  const positions = useMemo<Position[]>(() => {
    const hasCetes   = cetesPositions.length > 0
    const hasGbm     = gbmPositions.length > 0
    const hasRakuten = rakutenPositions.length > 0
    const hasTd      = tdPositions.length > 0
    const tdAccountIds = new Set(
      tdData.captures.map(c => TD_ACCOUNT_IDS[c.accountType]).filter((id): id is string => !!id)
    )
    return mockPositions
      .filter(p => !(hasTd      && tdAccountIds.has(p.accountId)))
      .filter(p => !(hasCetes   && CETES_MOCK_IDS.has(p.id)))
      .filter(p => !(hasGbm     && GBM_MOCK_IDS.has(p.id)))
      .filter(p => !(hasRakuten && RAKUTEN_MOCK_IDS.has(p.id)))
      .concat(cetesPositions)
      .concat(gbmPositions)
      .concat(rakutenPositions)
      .concat(tdPositions)
  }, [cetesPositions, gbmPositions, rakutenPositions, tdPositions, tdData.captures])

  return {
    positions,
    loading,
    cetes:   { loading: cetesData.loading,   isStale: cetesData.isStale,   lastUpdated: cetesData.lastUpdated },
    gbm:     { loading: gbmData.loading,     isStale: gbmData.isStale,     lastUpdated: gbmData.lastUpdated },
    rakuten: { loading: rakutenData.loading, isStale: rakutenData.isStale, lastUpdated: rakutenData.lastUpdated },
    td:      { loading: tdData.loading,      isStale: tdData.isStale,      lastUpdated: tdData.lastUpdated },
  }
}
