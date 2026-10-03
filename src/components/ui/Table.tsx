import { clsx } from 'clsx'
import type { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement> & { children: ReactNode }) {
  return (
    <tr
      className={clsx('border-b transition-colors', className)}
      style={{ borderColor: '#1E1E2E' }}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={clsx('px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide', className)}
      style={{ color: '#94A3B8' }}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={clsx('px-3 py-2.5', className)} style={{ color: '#F1F5F9' }} {...props}>
      {children}
    </td>
  )
}
