import { useTaskActions } from '../lib/actions'
import { isOverdue } from '../lib/dates'
import { focusReason } from '../lib/insights'
import type { Task } from '../lib/types'
import { useOpenTask } from '../lib/useOpenTask'

/** Thẻ màu duy nhất của trang: việc "Nên làm trước" kèm nút Xong / Dời ngay trên thẻ. */
export function FocusCard({ task, project }: { task: Task; project?: string }) {
  const actions = useTaskActions()
  const open = useOpenTask()
  const late = isOverdue(task)
  return (
    <section
      aria-label="Nên làm trước"
      className="mx-4 rounded-[10px] px-4 py-3.5"
      style={{ background: 'var(--focus-bg)', color: 'var(--focus-text)' }}
    >
      <div className="label" style={{ color: 'var(--focus-label)' }}>
        Nên làm trước
      </div>
      <button className="mt-1 block text-left font-serif text-lg leading-[1.3]" onClick={() => open(task.id)}>
        {task.title}
      </button>
      <p className="mt-1 text-xs" style={{ color: 'var(--focus-sub)' }}>
        {focusReason(task)}
        {project ? ` · ${project}` : ''}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          className="btn min-h-11 flex-1 px-2 whitespace-nowrap"
          style={{ background: 'var(--gs-bg)', color: 'var(--gs-fg)' }}
          onClick={() => actions.complete(task)}
        >
          Xong
        </button>
        <button
          className="btn min-h-11 flex-1 border px-2 text-sm whitespace-nowrap"
          style={{ borderColor: 'var(--focus-line)', color: 'var(--focus-text)' }}
          onClick={() => actions.move(task, late ? 'today' : 'tomorrow')}
        >
          {late ? 'Dời sang hôm nay' : 'Dời sang ngày mai'}
        </button>
      </div>
    </section>
  )
}
