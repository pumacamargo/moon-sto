import { LayoutDashboard, Briefcase, Target, TrendingUp, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  icon: LucideIcon
  /** Full label (sidebar, header title) */
  label: string
  /** Short label for the mobile bottom bar */
  short: string
  /** Shown in the mobile bottom bar (Settings lives in the header instead) */
  inBottomNav: boolean
}

export const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', short: 'Home', inBottomNav: true },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio', short: 'Portfolio', inBottomNav: true },
  { to: '/planned', icon: Target, label: 'Planned', short: 'Planned', inBottomNav: true },
  { to: '/performance', icon: TrendingUp, label: 'Performance', short: 'Perf', inBottomNav: true },
  { to: '/settings', icon: Settings, label: 'Settings', short: 'Settings', inBottomNav: false },
]

export function getPageTitle(pathname: string): string {
  return navItems.find((n) => n.to === pathname)?.label ?? 'Moonsto'
}
