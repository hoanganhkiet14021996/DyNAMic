import { addDays, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { useDeleteTask, useRestoreTasks, useUpdateTask } from './api'
import type { Task } from './types'
import { useTaskIndex } from './tasks'

export type MoveTarget = 'today' | 'tomorrow' | 'nextweek'

const TARGET_LABEL: Record<MoveTarget, string> = {
  today: 'hôm nay',
  tomorrow: 'ngày mai',
  nextweek: 'tuần sau',
}

/** Ngày đích; giữ nguyên giờ nếu việc có giờ, còn việc cả ngày thì đặt lúc 00:00. */
function moveDue(t: Task, target: MoveTarget) {
  const day = startOfDay(addDays(new Date(), target === 'today' ? 0 : target === 'tomorrow' ? 1 : 7))
  if (t.all_day || !t.due_at) return { due_at: day.toISOString(), all_day: true }
  const old = new Date(t.due_at)
  day.setHours(old.getHours(), old.getMinutes())
  // "Dời sang hôm nay" mà giờ cũ hôm nay đã qua thì vẫn bị coi là quá hạn → chuyển thành việc cả ngày hôm nay
  if (day.getTime() < Date.now()) {
    day.setHours(0, 0, 0, 0)
    return { due_at: day.toISOString(), all_day: true }
  }
  return { due_at: day.toISOString(), all_day: false }
}

/** Mọi thao tác nhanh trên một việc, đều có toast "Hoàn tác". */
export function useTaskActions() {
  const update = useUpdateTask()
  const del = useDeleteTask()
  const restore = useRestoreTasks()
  const { children } = useTaskIndex()

  return {
    complete(t: Task) {
      update.mutate({ id: t.id, patch: { status: 'done' } })
      toast(`Đã xong “${t.title}”`, {
        action: { label: 'Hoàn tác', onClick: () => update.mutate({ id: t.id, patch: { status: 'todo' } }) },
      })
    },
    reopen(t: Task) {
      update.mutate({ id: t.id, patch: { status: 'todo' } })
    },
    move(t: Task, target: MoveTarget) {
      const before = { due_at: t.due_at, all_day: t.all_day }
      update.mutate({ id: t.id, patch: moveDue(t, target) })
      toast(`Đã dời “${t.title}” sang ${TARGET_LABEL[target]}`, {
        action: { label: 'Hoàn tác', onClick: () => update.mutate({ id: t.id, patch: before }) },
      })
    },
    remove(t: Task) {
      const subs = children.get(t.id) ?? []
      del.mutate(t.id)
      toast(`Đã xóa “${t.title}”`, {
        action: { label: 'Hoàn tác', onClick: () => restore.mutate([t, ...subs]) },
      })
    },
  }
}
