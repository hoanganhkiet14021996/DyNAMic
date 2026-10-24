import type { ReactNode } from 'react'
import { cn } from '../../lib/tasks'

/** Vòng tiến độ: đầy dần theo `value` (0–100), đổi sang màu "xong" khi đủ 100. */
export function ProgressRing({ value, size = 76, children }: { value: number; size?: number; children?: ReactNode }) {
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-rule" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cn('transition-[stroke-dashoffset] duration-500', pct >= 100 ? 'stroke-forest' : 'stroke-teal')}
        />
      </svg>
      <div className="num absolute inset-0 flex items-center justify-center font-serif text-lg">{children}</div>
    </div>
  )
}
