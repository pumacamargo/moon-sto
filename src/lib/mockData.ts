import type { Account, Position, PlannedGroup, Transfer, ExchangeRates } from '../types'

export const mockExchangeRates: ExchangeRates = {
  CAD_MXN: 12.32,
  CAD_JPY: 112.5,
  MXN_CAD: 0.0812,
  JPY_CAD: 0.00889,
  MXN_JPY: 9.13,
  JPY_MXN: 0.1095,
  updatedAt: new Date(),
}

export const mockAccounts: Account[] = [
  { id: '1', name: 'RRSP', location: 'Canada', currency: 'CAD' },
  { id: '2', name: 'TFSA', location: 'Canada', currency: 'CAD' },
  { id: '3', name: 'Cash Canada', location: 'Canada', currency: 'CAD' },
  { id: '4', name: 'Cash Mexico', location: 'Mexico', currency: 'MXN' },
  { id: '5', name: 'GBM', location: 'Mexico', currency: 'MXN' },
  { id: '6', name: 'CETES', location: 'Mexico', currency: 'MXN' },
  { id: '7', name: 'NISA', location: 'Japan', currency: 'JPY' },
]

export const mockPositions: Position[] = [
  { id: '1', accountId: '1', ticker: 'CASH', category: 'CashC', subCategory: 'NA', value: 98097.69, currentValue: 98097.69, currency: 'CAD', pctGain: 0, lastUpdated: new Date() },
  { id: '2', accountId: '1', ticker: 'KILO', category: 'Metals & Commodities', subCategory: 'NA', value: 3484.99, currentValue: 2848.50, currency: 'CAD', pctGain: -22.34, lastUpdated: new Date() },
  { id: '3', accountId: '1', ticker: 'SBT', category: 'Metals & Commodities', subCategory: 'NA', value: 3754.99, currentValue: 2900.00, currency: 'CAD', pctGain: -29.48, lastUpdated: new Date() },
  { id: '4', accountId: '1', ticker: 'MSFT', category: 'Productive Assets US', subCategory: 'NA', value: 1128.05, currentValue: 1098.05, currency: 'CAD', pctGain: -2.73, lastUpdated: new Date() },
  { id: '5', accountId: '1', ticker: 'QS', category: 'Productive Assets US', subCategory: 'NA', value: 564.93, currentValue: 540.02, currency: 'CAD', pctGain: -4.61, lastUpdated: new Date() },
  { id: '6', accountId: '1', ticker: 'UBI', category: 'Productive Assets US', subCategory: 'Lottery', value: 702.72, currentValue: 877.60, currency: 'CAD', pctGain: 19.93, lastUpdated: new Date() },
  { id: '7', accountId: '1', ticker: 'U', category: 'Productive Assets US', subCategory: 'Lottery', value: 675.16, currentValue: 1042.12, currency: 'CAD', pctGain: 35.21, lastUpdated: new Date() },
  { id: '8', accountId: '1', ticker: 'UEC', category: 'Metals & Commodities', subCategory: 'NA', value: 634.74, currentValue: 626.71, currency: 'CAD', pctGain: -1.28, lastUpdated: new Date() },
  { id: '9', accountId: '2', ticker: 'CASH', category: 'CashC', subCategory: 'NA', value: 0, currentValue: 0, currency: 'CAD', pctGain: 0, lastUpdated: new Date() },
  { id: '10', accountId: '3', ticker: 'CASH', category: 'CashC', subCategory: 'NA', value: 31248.00, currentValue: 31248.00, currency: 'CAD', pctGain: 0, lastUpdated: new Date() },
  { id: '11', accountId: '4', ticker: 'BONDDIA', category: 'Bonddia', subCategory: 'NA', value: 315914.79, currentValue: 322279.08, currency: 'MXN', pctGain: 1.97, lastUpdated: new Date() },
  { id: '12', accountId: '5', ticker: 'FMTY14', category: 'REITs / Infrastructure', subCategory: 'NA', value: 122314.38, currentValue: 127510.48, currency: 'MXN', pctGain: 4.08, lastUpdated: new Date() },
  { id: '13', accountId: '5', ticker: 'DANHOS13', category: 'REITs / Infrastructure', subCategory: 'NA', value: 116710.71, currentValue: 124415.76, currency: 'MXN', pctGain: 6.19, lastUpdated: new Date() },
  { id: '14', accountId: '6', ticker: 'CETES', category: 'Cetes', subCategory: 'NA', value: 280757.09, currentValue: 283699.75, currency: 'MXN', pctGain: 1.04, lastUpdated: new Date() },
  { id: '15', accountId: '7', ticker: 'CASH', category: 'Productive Assets JP', subCategory: 'NA', value: 848138.00, currentValue: 848138.00, currency: 'JPY', pctGain: 0, lastUpdated: new Date() },
  { id: '16', accountId: '7', ticker: 'Nintendo', category: 'Productive Assets JP', subCategory: 'NA', value: 100752.00, currentValue: 105024.00, currency: 'JPY', pctGain: 4.07, lastUpdated: new Date() },
  { id: '17', accountId: '7', ticker: 'Sony', category: 'Productive Assets JP', subCategory: 'NA', value: 52110.00, currentValue: 53865.00, currency: 'JPY', pctGain: 3.26, lastUpdated: new Date() },
]

export const mockPlannedGroups: PlannedGroup[] = [
  {
    id: '1', name: 'Global Equities', targetPct: 50,
    categories: [
      { id: '1', groupId: '1', location: 'Canada', category: 'Productive Assets US', targetPct: 30, currentPct: 1.41, targetValue: 65184.51, currentValue: 3070.86, netPnl: 486.93 },
      { id: '2', groupId: '1', location: 'Japan', category: 'Productive Assets JP', targetPct: 10, currentPct: 4.16, targetValue: 21728.17, currentValue: 9035.23, netPnl: 54.40 },
      { id: '3', groupId: '1', location: 'Japan', category: 'Options Trading', targetPct: 10, currentPct: 0, targetValue: 21728.17, currentValue: 0, netPnl: 0 },
    ]
  },
  {
    id: '2', name: 'Bonds', targetPct: 20,
    categories: [
      { id: '4', groupId: '2', location: 'Mexico', category: 'Cetes', targetPct: 20, currentPct: 10.51, targetValue: 43456.34, currentValue: 22829.94, netPnl: 239.28 },
    ]
  },
  {
    id: '4', name: 'REITs / Infrastructure', targetPct: 10,
    categories: [
      { id: '6', groupId: '4', location: 'Mexico', category: 'REITs / InfrastructureM', targetPct: 7, currentPct: 8.95, targetValue: 15209.72, currentValue: 19436.47, netPnl: 1049.07 },
      { id: '7', groupId: '4', location: 'Canada', category: 'REITs / InfrastructureC', targetPct: 3, currentPct: 0, targetValue: 6518.45, currentValue: 0, netPnl: 0 },
    ]
  },
  {
    id: '6', name: 'Cash', targetPct: 10,
    categories: [
      { id: '9', groupId: '6', location: 'Mexico', category: 'Bonddia', targetPct: 7, currentPct: 11.82, targetValue: 15209.72, currentValue: 25688.81, netPnl: 517.52 },
      { id: '10', groupId: '6', location: 'Canada', category: 'CashC', targetPct: 3, currentPct: 59.53, targetValue: 6518.45, currentValue: 129345.69, netPnl: 0 },
      { id: '11', groupId: '6', location: 'Japan', category: 'CashJ', targetPct: 0, currentPct: 0, targetValue: 0, currentValue: 0, netPnl: 0 },
      { id: '12', groupId: '6', location: 'Mexico', category: 'CashM', targetPct: 0, currentPct: 0, targetValue: 0, currentValue: 0, netPnl: 0 },
    ]
  },
  {
    id: '3', name: 'SOFIPOs', targetPct: 5,
    categories: [
      { id: '5', groupId: '3', location: 'Mexico', category: 'SOFIPOs', targetPct: 5, currentPct: 0, targetValue: 10864.09, currentValue: 0, netPnl: 0 },
    ]
  },
  {
    id: '5', name: 'Gold / Commodities', targetPct: 5,
    categories: [
      { id: '8', groupId: '5', location: 'Canada', category: 'Metals & Commodities', targetPct: 5, currentPct: 3.62, targetValue: 10864.09, currentValue: 7874.72, netPnl: -1499.51 },
    ]
  },
]

export const mockTransfers: Transfer[] = [
  { id: '1', date: new Date('2026-01-30'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 5000, sentCurrency: 'CAD', exchangeRate: 12.77, arriveAmount: 63191.19, arriveCurrency: 'MXN', arriveInCAD: 4947.17, commissionCAD: 52.83, difference: 0 },
  { id: '2', date: new Date('2026-02-02'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 4500, sentCurrency: 'CAD', exchangeRate: 12.83, arriveAmount: 57108.06, arriveCurrency: 'MXN', arriveInCAD: 4452.28, commissionCAD: 47.72, difference: 0 },
  { id: '3', date: new Date('2026-02-03'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 9500, sentCurrency: 'CAD', exchangeRate: 12.63, arriveAmount: 118749.56, arriveCurrency: 'MXN', arriveInCAD: 9401.14, commissionCAD: 98.86, difference: 0 },
  { id: '4', date: new Date('2026-02-05'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 9500, sentCurrency: 'CAD', exchangeRate: 12.73, arriveAmount: 119637.03, arriveCurrency: 'MXN', arriveInCAD: 9401.14, commissionCAD: 98.86, difference: 0 },
  { id: '5', date: new Date('2026-02-09'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 9500, sentCurrency: 'CAD', exchangeRate: 12.66, arriveAmount: 119006.21, arriveCurrency: 'MXN', arriveInCAD: 9401.14, commissionCAD: 98.86, difference: 0 },
  { id: '6', date: new Date('2026-02-12'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 9500, sentCurrency: 'CAD', exchangeRate: 12.67, arriveAmount: 119127.94, arriveCurrency: 'MXN', arriveInCAD: 9404.07, commissionCAD: 95.93, difference: 0 },
  { id: '7', date: new Date('2026-02-17'), from: 'TD - 8210', to: 'Jap - 5749', sentAmount: 9500, sentCurrency: 'CAD', exchangeRate: 112.41, arriveAmount: 1059739.00, arriveCurrency: 'JPY', arriveInCAD: 9427.78, commissionCAD: 72.22, difference: 0 },
  { id: '8', date: new Date('2026-02-25'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 9500, sentCurrency: 'CAD', exchangeRate: 12.55, arriveAmount: 118082.95, arriveCurrency: 'MXN', arriveInCAD: 9410.50, commissionCAD: 89.50, difference: 0 },
  { id: '9', date: new Date('2026-03-03'), from: 'TD - 8210', to: 'Mex - 8448', sentAmount: 9500, sentCurrency: 'CAD', exchangeRate: 12.66, arriveAmount: 119041.00, arriveCurrency: 'MXN', arriveInCAD: 9401.14, commissionCAD: 98.86, difference: 0 },
]

export const TOTAL_CAD = 217281.71
