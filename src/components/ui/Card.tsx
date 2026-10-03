import { clsx } from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-4',
        className
      )}
      style={{ background: '#12121A', borderColor: '#1E1E2E', ...style }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={clsx('mb-3', className)}>{children}</div>
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={clsx('text-sm font-medium', className)} style={{ color: '#94A3B8' }}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: CardProps) {
  return <div className={clsx(className)}>{children}</div>
}
