import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'gain' | 'loss' | 'neutral' | 'accent'
  className?: string
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const styles: Record<string, string> = {
    gain: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    loss: 'bg-red-500/15 text-red-400 border border-red-500/20',
    neutral: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
    accent: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  }

  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', styles[variant], className)}>
      {children}
    </span>
  )
}
