import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from '../components/ui/StatCard'
import { Card, CardTitle, CardHeader } from '../components/ui/Card'
import { useCurrency } from '../contexts/CurrencyContext'
import { useAllPositions } from '../hooks/useAllPositions'
import type { BrokerStaleInfo } from '../hooks/useAllPositions'
import { plannedGroups } from '../lib/portfolioData'
import { formatPct } from '../lib/currency'
import type { Location, Position } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0A0A0F',
  card: '#12121A',
  border: '#1E1E2E',
  text: '#F1F5F9',
  muted: '#94A3B8',
  up: '#10B981',
  down: '#EF4444',
  warn: '#F59E0B',
}

const GROUP_COLORS: Record<string, string> = {
  'Global Equities': '#818CF8',
  'Bonds': '#34D399',
  'REITs / Infrastructure': '#FBBF24',
  'Cash': '#94A3B8',
  'SOFIPOs': '#6EE7B7',
  'Gold / Commodities': '#F59E0B',
}
const UNCLASSIFIED = 'Unclassified'
const UNCLASSIFIED_COLOR = '#475569'

const LOCATION_COLORS: Record<Location, string> = {
  Canada: '#F87171',
  Mexico: '#34D399',
  Japan: '#818CF8',
}
const LOCATION_FLAGS: Record<Location, string> = { Canada: '🇨🇦', Mexico: '🇲🇽', Japan: '🇯🇵' }
const LOCATION_TARGETS: Record<Location, number> = { Canada: 40, Mexico: 40, Japan: 20 }

const ACCOUNT_LOCATION: Record<string, Location> = {
  '1': 'Canada', '2': 'Canada', '3': 'Canada',
  '4': 'Mexico', '5': 'Mexico', '6': 'Mexico',
  '7': 'Japan',
}

/** Exact category → group, derived from the investment plan. */
const PLAN_CATEGORY_GROUP: Record<string, string> = Object.fromEntries(
  plannedGroups.flatMap(g => g.categories.map(c => [c.category, g.name]))
)

/**
 * Broker-side categories that don't literally match a plan category yet
 * (legacy names coming from the scrapers). Used only as a fallback.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  'Productive Assets US': 'Global Equities',
  'Productive Assets JP': 'Global Equities',
  'Reporto': 'Bonds',
  'Cash': 'Cash',
  'REITs / Infrastructure': 'REITs / Infrastructure',
}

function groupForCategory(category: string): string {
  return PLAN_CATEGORY_GROUP[category] ?? CATEGORY_ALIASES[category] ?? UNCLASSIFIED
}

const TOOLTIP_STYLE = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 12,
}

// ── Small presentational pieces ──────────────────────────────────────────────

/** Horizontal bar with current fill and a vertical tick marking the target. */
function TargetBar({ label, color, current, target, amount, prefix }: {
  label: string
  color: string
  current: number
  target: number
  amount: string
  prefix?: string
}) {
  const diff = current - target
  const scaleMax = Math.max(100, current, target)
  const off = Math.abs(diff) >= 2
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2 truncate" style={{ color: C.text }}>
          {prefix ? <span aria-hidden>{prefix}</span> : (
            <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
          )}
          <span className="truncate font-medium">{label}</span>
        </span>
        <span className="shrink-0 tabular-nums" style={{ color: C.muted }}>
          <span className="font-semibold" style={{ color: C.text }}>{current.toFixed(1)}%</span>
          {' / '}{target}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: C.border }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${(current / scaleMax) * 100}%`, background: color }}
        />
        <div
          className="absolute inset-y-[-2px] w-0.5"
          style={{ left: `calc(${(target / scaleMax) * 100}% - 1px)`, background: C.text, opacity: 0.85 }}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums" style={{ color: C.muted }}>
        <span>{amount}</span>
        <span style={{ color: off ? (diff > 0 ? C.warn : C.muted) : C.up }}>
          {off ? `${diff > 0 ? 'Over' : 'Under'} by ${Math.abs(diff).toFixed(1)} pts` : 'On target'}
        </span>
      </div>
    </div>
  )
}

function BrokerChip({ name, info }: { name: string; info: BrokerStaleInfo }) {
  let color = C.up
  let status = 'Up to date'
  if (info.loading) { color = C.muted; status = 'Loading…' }
  else if (!info.lastUpdated) { color = C.down; status = 'No data' }
  else if (info.isStale) { color = C.warn; status = 'Stale' }

  const when = info.lastUpdated ? relativeTime(info.lastUpdated) : null
  return (
    <div
      className="flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2"
      style={{ background: C.card, borderColor: C.border }}
      title={info.lastUpdated ? info.lastUpdated.toLocaleString() : status}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <div className="min-w-0 leading-tight">
        <p className="text-xs font-semibold" style={{ color: C.text }}>{name}</p>
        <p className="truncate text-[11px]" style={{ color }}>{status}{when ? ` · ${when}` : ''}</p>
      </div>
    </div>
  )
}

function MoverRow({ p, valueText }: { p: Position; valueText: string }) {
  const up = p.pctGain >= 0
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold" style={{ color: C.text }}>{p.ticker}</p>
        <p className="truncate text-xs" style={{ color: C.muted }}>{p.name ?? p.category}</p>
      </div>
      <div className="shrink-0 text-right">
        <span
          className="inline-block rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums"
          style={{ color: up ? C.up : C.down, background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}
        >
          {formatPct(p.pctGain)}
        </span>
        <p className="mt-0.5 text-xs tabular-nums" style={{ color: C.muted }}>{valueText}</p>
      </div>
    </li>
  )
}

function relativeTime(d: Date): string {
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border ${className ?? ''}`} style={{ background: C.card, borderColor: C.border }} />
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Skeleton className="col-span-2 h-24 lg:col-span-1" />
        <Skeleton className="col-span-2 h-24 lg:col-span-1" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-3" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { positions, loading, cetes, gbm, rakuten, td } = useAllPositions()
  const { convert, formatDisplay } = useCurrency()

  const data = useMemo(() => {
    const live = positions.filter(p => p.currentValue > 0)
    const disp = (p: Position) => convert(p.currentValue, p.currency)

    const total = live.reduce((s, p) => s + disp(p), 0)
    const cost = live.reduce((s, p) => s + convert(p.value, p.currency), 0)
    const pnl = total - cost
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0

    // Group allocation
    const byGroup = new Map<string, number>()
    for (const p of live) {
      const g = groupForCategory(p.category)
      byGroup.set(g, (byGroup.get(g) ?? 0) + disp(p))
    }
    const groups = plannedGroups.map(g => {
      const value = byGroup.get(g.name) ?? 0
      return {
        name: g.name,
        color: GROUP_COLORS[g.name] ?? C.muted,
        value,
        current: total > 0 ? (value / total) * 100 : 0,
        target: g.targetPct,
      }
    })
    const unclassifiedValue = byGroup.get(UNCLASSIFIED) ?? 0
    const unclassifiedCats = [...new Set(live.filter(p => groupForCategory(p.category) === UNCLASSIFIED).map(p => p.category))]

    // Location allocation
    const byLoc: Record<Location, number> = { Canada: 0, Mexico: 0, Japan: 0 }
    for (const p of live) {
      const loc = ACCOUNT_LOCATION[p.accountId]
      if (loc) byLoc[loc] += disp(p)
    }
    const locations = (Object.keys(LOCATION_TARGETS) as Location[]).map(loc => ({
      name: loc,
      value: byLoc[loc],
      current: total > 0 ? (byLoc[loc] / total) * 100 : 0,
      target: LOCATION_TARGETS[loc],
    }))

    // Drift = sum of absolute deviation / 2 (share of portfolio that would need to move)
    const drift = groups.reduce((s, g) => s + Math.abs(g.current - g.target), 0) / 2
      + (total > 0 ? (unclassifiedValue / total) * 100 : 0) / 2
    const biggestGap = [...groups].sort((a, b) => (a.current - a.target) - (b.current - b.target))[0]

    // Movers (exclude flat cash-like positions)
    const movable = live.filter(p => p.pctGain !== 0)
    const sorted = [...movable].sort((a, b) => b.pctGain - a.pctGain)
    const gainers = sorted.filter(p => p.pctGain > 0).slice(0, 3)
    const losers = sorted.filter(p => p.pctGain < 0).reverse().slice(0, 3)

    return {
      live, total, pnl, pnlPct, groups, unclassifiedValue, unclassifiedCats,
      locations, drift, biggestGap, gainers, losers, disp,
    }
  }, [positions, convert])

  const brokers: { name: string; info: BrokerStaleInfo }[] = [
    { name: 'CETES', info: cetes },
    { name: 'GBM', info: gbm },
    { name: 'Rakuten', info: rakuten },
    { name: 'TD', info: td },
  ]
  const activeBrokers = brokers.filter(b => !b.info.loading && !b.info.isStale && b.info.lastUpdated).length

  if (loading) return <DashboardSkeleton />

  const pieData = [
    ...data.groups.filter(g => g.value > 0).map(g => ({ name: g.name, value: g.value, color: g.color })),
    ...(data.unclassifiedValue > 0 ? [{ name: UNCLASSIFIED, value: data.unclassifiedValue, color: UNCLASSIFIED_COLOR }] : []),
  ]
  const fmt = (n: number) => formatDisplay(n)
  const pnlSign = data.pnl >= 0 ? '+' : '−'

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* 1. Summary stats — Total and P&L full-width on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Portfolio"
          value={fmt(data.total)}
          sub={`Plan drift ${data.drift.toFixed(1)}%`}
          highlight
          className="col-span-2 lg:col-span-1"
        />
        <StatCard
          label="Net P&L"
          value={`${pnlSign}${fmt(Math.abs(data.pnl))}`}
          sub={`${formatPct(data.pnlPct)} vs cost basis`}
          trend={data.pnl}
          className="col-span-2 lg:col-span-1"
        />
        <StatCard
          label="Brokers active"
          value={`${activeBrokers} / ${brokers.length}`}
          sub={activeBrokers === brokers.length ? 'All synced' : `${brokers.length - activeBrokers} need sync`}
        />
        <StatCard
          label="Positions"
          value={String(data.live.length)}
          sub="With value > 0"
        />
      </div>

      {/* 5. Broker status chips */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {brokers.map(b => <BrokerChip key={b.name} name={b.name} info={b.info} />)}
      </div>

      {/* 2. Allocation by group */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-baseline justify-between gap-2">
            <CardTitle>Allocation by Group</CardTitle>
            <span className="text-xs" style={{ color: C.muted }}>current / target</span>
          </CardHeader>
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative mx-auto h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="100%"
                    paddingAngle={2}
                    stroke={C.card}
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={{ color: C.text }}
                    formatter={(v, n) => [`${fmt(Number(v))} · ${((Number(v) / data.total) * 100).toFixed(1)}%`, String(n)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Drift</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: data.drift < 5 ? C.up : data.drift < 15 ? C.warn : C.down }}>
                  {data.drift.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {data.groups.map(g => (
                <TargetBar
                  key={g.name}
                  label={g.name}
                  color={g.color}
                  current={g.current}
                  target={g.target}
                  amount={fmt(g.value)}
                />
              ))}
              {data.unclassifiedValue > 0 && (
                <p className="text-xs" style={{ color: C.muted }}>
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: UNCLASSIFIED_COLOR }} />
                  {fmt(data.unclassifiedValue)} unclassified ({data.unclassifiedCats.join(', ')})
                </p>
              )}
            </div>
          </div>
          {data.biggestGap && data.biggestGap.current < data.biggestGap.target - 2 && (
            <div className="mt-4 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.08)', color: C.text }}>
              Next contribution → <span className="font-semibold">{data.biggestGap.name}</span>
              <span style={{ color: C.muted }}>
                {' '}is {(data.biggestGap.target - data.biggestGap.current).toFixed(1)}% under target
                ({fmt(((data.biggestGap.target - data.biggestGap.current) / 100) * data.total)} to rebalance)
              </span>
            </div>
          )}
        </Card>

        {/* 3. Allocation by location */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-baseline justify-between gap-2">
            <CardTitle>Allocation by Location</CardTitle>
            <span className="text-xs" style={{ color: C.muted }}>target 40 / 40 / 20</span>
          </CardHeader>
          {/* Stacked composition strip */}
          <div className="mb-5 flex h-3 w-full overflow-hidden rounded-full" style={{ background: C.border }}>
            {data.locations.map(l => (
              <div key={l.name} style={{ width: `${l.current}%`, background: LOCATION_COLORS[l.name] }} title={`${l.name} ${l.current.toFixed(1)}%`} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {data.locations.map(l => (
              <TargetBar
                key={l.name}
                label={l.name}
                prefix={LOCATION_FLAGS[l.name]}
                color={LOCATION_COLORS[l.name]}
                current={l.current}
                target={l.target}
                amount={fmt(l.value)}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Top movers */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Top Gainers</CardTitle>
            <span className="text-xs" style={{ color: C.up }}>▲</span>
          </CardHeader>
          {data.gainers.length === 0 ? (
            <p className="py-4 text-sm" style={{ color: C.muted }}>No positions in the green yet.</p>
          ) : (
            <ul className="divide-y divide-[#1E1E2E]">
              {data.gainers.map(p => <MoverRow key={p.id} p={p} valueText={fmt(data.disp(p))} />)}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Top Losers</CardTitle>
            <span className="text-xs" style={{ color: C.down }}>▼</span>
          </CardHeader>
          {data.losers.length === 0 ? (
            <p className="py-4 text-sm" style={{ color: C.muted }}>Nothing in the red.</p>
          ) : (
            <ul className="divide-y divide-[#1E1E2E]">
              {data.losers.map(p => <MoverRow key={p.id} p={p} valueText={fmt(data.disp(p))} />)}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
