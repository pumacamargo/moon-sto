import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ children, variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    secondary: 'border text-slate-300 hover:bg-slate-800',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
  }

  const sizes = {
    // Mobile-first: 44px minimum touch target, tighter on md+ (pointer devices)
    sm: 'min-h-11 px-3 text-xs md:min-h-8',
    md: 'min-h-11 px-4 text-sm md:min-h-9',
    lg: 'min-h-12 px-5 text-base md:min-h-11',
  }

  const secondaryStyle = variant === 'secondary' ? { borderColor: '#1E1E2E' } : {}

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      style={secondaryStyle}
      {...props}
    >
      {children}
    </button>
  )
}
