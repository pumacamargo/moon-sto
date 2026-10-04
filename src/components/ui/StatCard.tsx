import { clsx } from 'clsx'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: number
  /** Hero variant: larger value, used for the key figure on a page */
  highlight?: boolean
  className?: string
}

export function StatCard({ label, value, sub, trend, highlight, className }: StatCardProps) {
  const trendColor = trend === undefined ? '#F1F5F9' : trend >= 0 ? '#10B981' : '#EF4444'

  return (
    <div
      className={clsx('min-w-0 rounded-xl border p-4 md:p-5', className)}
      style={{
        background: highlight ? 'linear-gradient(135deg, rgba(99,102,241,0.14), #12121A 60%)' : '#12121A',
        borderColor: highlight ? 'rgba(99,102,241,0.3)' : '#1E1E2E',
      }}
    >
      <p className="mb-1.5 text-xs font-medium uppercase leading-snug tracking-wide break-words" style={{ color: '#94A3B8' }}>
        {label}
      </p>
      <p
        className={clsx(
          'font-bold leading-tight tabular-nums break-words',
          highlight ? 'text-3xl lg:text-2xl' : 'text-xl md:text-2xl'
        )}
        style={{ color: trendColor }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs break-words md:text-sm" style={{ color: '#94A3B8' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
