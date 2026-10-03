interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: number
}

export function StatCard({ label, value, sub, trend }: StatCardProps) {
  const trendColor = trend === undefined ? '#F1F5F9' : trend >= 0 ? '#10B981' : '#EF4444'

  return (
    <div className="rounded-xl border p-4" style={{ background: '#12121A', borderColor: '#1E1E2E' }}>
      <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#94A3B8' }}>
        {label}
      </p>
      <p className="text-xl font-bold" style={{ color: trend !== undefined ? trendColor : '#F1F5F9' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
