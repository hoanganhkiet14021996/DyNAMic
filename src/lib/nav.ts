import { CalendarDays, FolderOpen, House, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon }

export const NAV_ITEMS: NavItem[] = [
  { to: '/today', label: 'Hôm nay', icon: House },
  { to: '/upcoming', label: 'Sắp tới', icon: CalendarDays },
  { to: '/projects', label: 'Dự án', icon: FolderOpen },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]
