import type { ReactNode } from 'react'
import { cn } from '../lib/tasks'

/** Nhãn nhỏ viết hoa phía trên + tiêu đề serif. `greet` = cỡ chữ nhỏ dùng cho câu chào ở Hôm nay. */
export function PageHeader({
  label,
  title,
  right,
  greet,
}: {
  label?: ReactNode
  title: ReactNode
  right?: ReactNode
  greet?: boolean
}) {
  return (
    <header className="pt-safe flex items-start justify-between gap-3 px-5 pb-3">
      <div className="min-w-0">
        {label && <div className="label">{label}</div>}
        <h1 className={cn('mt-0.5 font-serif leading-tight font-normal', greet ? 'text-base font-medium' : 'text-xl')}>{title}</h1>
      </div>
      {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
    </header>
  )
}
