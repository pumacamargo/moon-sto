import { clsx } from 'clsx'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export function Select({ options, className, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        'rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
        className
      )}
      style={{
        background: '#12121A',
        borderColor: '#1E1E2E',
        color: '#F1F5F9',
      }}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
