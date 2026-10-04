interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: number
}

export function StatCard({ label, value, sub, trend }: StatCardProps) {
  const trendColor = trend === undefined ? '#F1F5F9' : trend >= 0 ? '#10B981' : '#EF4444'

  return (
    <div className="min-w-0 rounded-xl border p-3 sm:p-4" style={{ background: '#12121A', borderColor: '#1E1E2E' }}>
      <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide sm:tracking-wider mb-1.5 sm:mb-2 leading-snug break-words" style={{ color: '#94A3B8' }}>
        {label}
      </p>
      <p className="text-base sm:text-xl font-bold tabular-nums break-words leading-tight" style={{ color: trend !== undefined ? trendColor : '#F1F5F9' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1 break-words" style={{ color: '#94A3B8' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
