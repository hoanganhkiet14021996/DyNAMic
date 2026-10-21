import { motion } from 'motion/react'
import { cn } from '../lib/tasks'
import type { Task } from '../lib/types'

const RING = ['border-ring', 'border-ring', 'border-amber', 'border-oxblood']

/** Ô tròn hoàn thành: viền theo mức ưu tiên; khi xong, dấu tích được vẽ như nét bút. */
export function PenCheck({
  task,
  size = 24,
  onToggle,
}: {
  task: Pick<Task, 'status' | 'priority'>
  size?: number
  onToggle: () => void
}) {
  const done = task.status === 'done'
  return (
    <button
      type="button"
      aria-label={done ? 'Bỏ hoàn thành' : 'Hoàn thành'}
      aria-pressed={done}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      // vùng chạm 44px dù ô nhìn thấy chỉ 24px
      className="-m-2.5 flex shrink-0 items-center justify-center p-2.5"
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full border-2 transition-colors',
          done ? 'border-forest bg-forest' : RING[task.priority] ?? 'border-ring',
        )}
        style={{ width: size, height: size }}
      >
        {done && (
          <svg viewBox="0 0 24 24" width={size - 10} height={size - 10} fill="none" className="text-canvas">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth={3.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </svg>
        )}
      </span>
    </button>
  )
}
