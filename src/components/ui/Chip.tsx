import type { ReactNode } from 'react'
import { cn } from '../../lib/tasks'

/** Nút chọn nhanh dạng viên bo 10px; đang chọn = nền nâu / teal nhạt (tuỳ theme). */
export function Chip({
  selected,
  onClick,
  children,
  className,
  label,
}: {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={cn('chip', selected && 'border-brand bg-brand font-semibold text-on-brand', className)}
    >
      {children}
    </button>
  )
}
