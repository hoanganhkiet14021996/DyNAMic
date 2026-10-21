import type { CSSProperties } from 'react'
import { cn } from '../../lib/tasks'

/** Thanh tiến độ mảnh 6px. Truyền `color` (hex) để dùng màu project, mặc định là teal. */
export function ProgressLine({ value, color, className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-rule', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', color ? 'pcolor' : 'bg-teal')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, ...(color ? ({ '--c': color } as CSSProperties) : {}) }}
      />
    </div>
  )
}
