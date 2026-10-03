import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: number
}

export function StatCard({ label, value, sub, trend }: StatCardProps) {
  return (
    <Card>
      <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 12,
          marginTop: 4,
          color: trend !== undefined
            ? (trend >= 0 ? '#10B981' : '#EF4444')
            : '#94A3B8'
        }}>
          {sub}
        </div>
      )}
    </Card>
  )
}
