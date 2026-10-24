import { cn } from '../lib/tasks'
import type { WeekDay } from '../lib/insights'

/** Dải tuần mini: chấm đầy = hôm đó đã xong ít nhất một việc. */
export function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <div className="grid grid-cols-7 px-5 pb-4" role="img" aria-label="Tuần này">
      {days.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1.5">
          <span className={cn('text-xs font-medium', d.isToday ? 'text-teal' : 'text-cap')}>{d.label}</span>
          <span
            className={cn(
              'size-3 rounded-full border-[1.5px]',
              d.done > 0 ? 'border-teal bg-teal' : d.isFuture ? 'border-rule2 border-dashed' : 'border-rule2',
              d.isToday && d.done === 0 && 'border-teal',
            )}
          />
        </div>
      ))}
    </div>
  )
}
