const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

const source = fs.readFileSync(path.join(__dirname, 'notify.js'), 'utf8')
const code = source.slice(0, source.indexOf('main().catch(async err => {'))
function context(fetch = async () => { throw new Error('unexpected network call') }) {
  const ctx = vm.createContext({ fetch, console: { log() {}, error() {} }, process: { env: {} }, AbortSignal, Intl, Date })
  vm.runInContext(code + '\n globalThis.api = { PLAN, main, getLatestSnapshot, getPriceAndATH, isTargetMonday };', ctx)
  return ctx
}
const position = (ticker, accountId, currentValue = 112500, currency = 'JPY') => ({ ticker, accountId, currentValue, currency, category: 'ETF' })

test('NISA codes and Canadian matches remain distinct', () => {
  const plan = context().api.PLAN
  const jp = plan.filter(p => p.location.includes('Japan'))
  assert.deepEqual(Array.from(jp.map(p => [p.ticker, p.currency, p.lotSize])), [['2559.T', 'JPY', 1], ['2558.T', 'JPY', 1]])
  assert.equal(jp[0].match(position('2559', '7')), true)
  assert.equal(jp[1].match(position('2558', '7')), true)
  assert.equal(jp[0].match(position('VXC', '7')), false)
  assert.equal(jp[1].match(position('VFV', '7')), false)
  assert.equal(jp[0].match(position('2559', '1')), false)
  assert.equal(plan[0].match(position('VXC', '1')), true)
  assert.equal(plan[0].match(position('VXC', '7')), false)
  assert.equal(plan[3].match(position('VCN', '2')), true)
  assert.equal(plan[0].ticker, 'VXC.TO')
  assert.equal(plan[3].ticker, 'VCN.TO')
})

test('Japan units use converted JPY budget, JPY price, and show actual cost; Canada original output', async () => {
  const ctx = context()
  const messages = []
  ctx.snapshotFn = async () => ({ totalCAD: 217281.71, positions: [position('2559', '7'), position('2558', '7'), position('VXC', '1', 1000, 'CAD')] })
  ctx.priceFn = async ticker => ({ price: ({ '2559.T': 2956, '2558.T': 3521, 'VXC.TO': 90, 'VCN.TO': 74 })[ticker], ath: ticker.endsWith('.T') ? null : 100 })
  ctx.sendFn = async msg => { messages.push(msg) }
  vm.runInContext('getLatestSnapshot = snapshotFn; getPriceAndATH = priceFn; sendTelegram = sendFn; isTargetMonday = () => true', ctx)
  await ctx.api.main()
  assert.equal(messages.length, 1)
  const msg = messages[0]
  for (const [ticker, price, name] of [['2559', 2956, 'MAXIS All Country World Equity ETF 2559'], ['2558', 3521, 'MAXIS S&P 500 US Equity ETF 2558']]) {
    const gap = 21728.17 - 112500 * 0.00889
    const budget = gap * 0.05 * 112.5
    const units = Math.floor(budget / price)
    assert.ok(msg.includes(name))
    assert.ok(msg.includes(`Price: ¥${price.toLocaleString('en-US')} JPY`))
    assert.ok(msg.includes(`${units} units = ¥${(units * price).toLocaleString('en-US')} JPY`))
    assert.ok(msg.includes(`Budget: ¥${Math.round(budget).toLocaleString('en-US')} JPY`))
    assert.ok(units * price <= budget && (units + 1) * price > budget)
  }
  assert.match(msg, /VXC \(Global - Canada\).*?Price: \$90\.00 · ATH: \$100\.00/s)
  assert.match(msg, /VCN \(Canada\).*?Price: \$74\.00 · ATH: \$100\.00/s)
  assert.match(msg, /VXC \(Global - Canada\).*?Buy this time: <b>\d+ units = \$[\d,]+ CAD<\/b>/s)
  assert.ok(!msg.includes('VFV (S&P 500) [Japan'))
})

test('Yahoo quote validates symbol and currency; split-skewed ATH falls back', async () => {
  let symbol = '2559.T', currency = 'JPY', price = 2956
  const fetch = async url => ({ ok: true, json: async () => url.includes('range=5d') ?
    { chart: { result: [{ meta: { symbol, currency, regularMarketPrice: price } }] } } :
    { chart: { result: [{ indicators: { quote: [{ high: [30800, 3007], close: [2956] }] } }] } } })
  const api = context(fetch).api
  assert.equal((await api.getPriceAndATH('2559.T')).ath, null)
  currency = 'CAD'
  assert.equal((await api.getPriceAndATH('2559.T')).price, null)
  symbol = '2558.T'; currency = 'JPY'; price = 3521
  assert.equal((await api.getPriceAndATH('2559.T')).price, null)
})

test('Firestore failure or malformed holdings cannot become zero positions', async () => {
  const fail = context(async () => ({ ok: false, status: 403 })).api
  await assert.rejects(fail.getLatestSnapshot(), /Firestore HTTP 403/)
  const malformed = context(async () => ({ ok: true, json: async () => [{ document: { fields: { totalCAD: { doubleValue: 100 } } } }] })).api
  await assert.rejects(malformed.getLatestSnapshot(), /Invalid Firestore positions/)
})

test('Tokyo first and third Monday gate preserved', () => {
  const gate = context().api.isTargetMonday
  assert.equal(gate(new Date('2026-10-19T12:00:00Z')), true)
  assert.equal(gate(new Date('2026-10-18T14:59:00Z')), false)
  assert.equal(gate(new Date('2026-10-26T12:00:00Z')), false)
  assert.equal(gate(new Date('2026-11-02T12:00:00Z')), true)
})
