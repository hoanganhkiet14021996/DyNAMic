import type { CSSProperties } from 'react'
import { useAreas, useProjects } from '../lib/api'
import { useTaskActions } from '../lib/actions'
import { dueLabel, formatClock, isOverdue } from '../lib/dates'
import { cn } from '../lib/tasks'
import type { Task } from '../lib/types'
import { useOpenTask } from '../lib/useOpenTask'
import { PenCheck } from './PenCheck'
import { SwipeRow } from './SwipeRow'

/**
 * Dòng việc dùng khắp app. `showDue` bật khi trang không có sẵn mốc ngày (Inbox, Project, tìm kiếm...);
 * ở Hôm nay / Sắp tới chỉ hiện giờ ở bên phải.
 * `dense` = dòng gọn dưới lịch tháng (Sắp tới): chữ nhỏ hơn, chỉ một dòng: tên việc + giờ + chấm màu project / khu vực.
 */
export function TaskRow({
  task,
  subtasks,
  showDue = false,
  dense = false,
}: {
  task: Task
  subtasks: Task[]
  showDue?: boolean
  dense?: boolean
}) {
  const open = useOpenTask()
  const actions = useTaskActions()
  const { data: projects } = useProjects()
  const { data: areas } = useAreas()
  const project = projects?.find((p) => p.id === task.project_id)
  const area = areas?.find((a) => a.id === (task.area_id ?? project?.area_id))
  const dotColor = project?.color ?? area?.color ?? 'var(--cap)'
  const done = task.status === 'done'
  const overdue = isOverdue(task)
  const timed = !task.all_day && !!task.due_at
  const subDone = subtasks.filter((s) => s.status === 'done').length
  const showDueLabel = !!task.due_at && showDue

  return (
    <SwipeRow
      disabled={done}
      onComplete={() => actions.complete(task)}
      onTap={() => open(task.id)}
      actions={(close) => (
        <>
          <button
            className="w-[78px] bg-teal text-sm font-semibold text-on-teal"
            onClick={() => {
              actions.move(task, 'tomorrow')
              close()
            }}
          >
            Ngày mai
          </button>
          <button
            className="w-[78px] bg-oxblood text-sm font-semibold text-canvas"
            onClick={() => {
              actions.remove(task)
              close()
            }}
          >
            Xóa
          </button>
        </>
      )}
    >
      {dense ? (
        <div className="flex min-h-11 items-center gap-3 border-t border-rule px-5 py-2">
          <PenCheck task={task} size={20} onToggle={() => (done ? actions.reopen(task) : actions.complete(task))} />
          <div className={cn('min-w-0 flex-1 truncate text-base', done && 'text-cap line-through')}>{task.title}</div>
          {timed && !showDue && (
            <span className={cn('num shrink-0 text-sm font-medium', overdue ? 'text-oxblood' : 'text-cap')}>{formatClock(task.due_at!)}</span>
          )}
          <span
            className="pcolor size-2.5 shrink-0 rounded-full"
            style={{ '--c': dotColor } as CSSProperties}
            title={project?.name ?? area?.name ?? 'Inbox'}
          />
        </div>
      ) : (
        <div className="flex min-h-[54px] items-start gap-3.5 border-t border-rule px-5 py-3">
          <div className="pt-px">
            <PenCheck task={task} onToggle={() => (done ? actions.reopen(task) : actions.complete(task))} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn('text-base leading-snug font-medium break-words', done && 'text-cap line-through')}>{task.title}</div>
            <div className="mt-[3px] flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-cap">
              {task.status === 'doing' && (
                <span className="rounded-full border border-ring px-2 py-px text-xs font-semibold text-teal">Đang làm</span>
              )}
              {showDueLabel && <span className={cn(overdue && 'font-semibold text-oxblood')}>{dueLabel(task)}</span>}
              {subtasks.length > 0 && (
                <span>
                  ▸ {subDone}/{subtasks.length}
                </span>
              )}
              {!subtasks.length && !done && task.progress > 0 && <span>{task.progress}%</span>}
              {project && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="pcolor h-2 w-2 rounded-full" style={{ '--c': project.color } as CSSProperties} />
                  {project.name}
                </span>
              )}
            </div>
          </div>
          {timed && !showDue && (
            <div className={cn('num pt-0.5 text-sm font-semibold', overdue ? 'text-oxblood' : 'text-body')}>{formatClock(task.due_at!)}</div>
          )}
        </div>
      )}
    </SwipeRow>
  )
}
