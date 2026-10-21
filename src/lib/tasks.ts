import { useMemo } from 'react'
import { useTasks } from './api'
import { isOverdue } from './dates'
import type { Task } from './types'

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/**
 * UUID v4 tạo ở client. crypto.randomUUID chỉ có trên HTTPS/localhost (mở qua http LAN trên điện thoại sẽ lỗi),
 * nên dùng getRandomValues — có ở mọi ngữ cảnh.
 */
export function newId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Tiến độ 0–100: theo subtask nếu có, ngược lại theo trạng thái / % nhập tay. */
export function taskProgress(task: Task, children: Task[]) {
  if (children.length) return Math.round((children.filter((c) => c.status === 'done').length / children.length) * 100)
  return task.status === 'done' ? 100 : task.progress
}

/** Thứ tự mặc định: quá hạn → có deadline sớm → ưu tiên cao → thứ tự tạo. */
export function compareTasks(a: Task, b: Task) {
  const ao = isOverdue(a) ? 0 : 1
  const bo = isOverdue(b) ? 0 : 1
  if (ao !== bo) return ao - bo
  if (a.due_at !== b.due_at) {
    if (!a.due_at) return 1
    if (!b.due_at) return -1
    return a.due_at < b.due_at ? -1 : 1
  }
  if (a.priority !== b.priority) return b.priority - a.priority
  return a.sort_order - b.sort_order
}

/** Danh sách task gốc (không phải subtask) + bản đồ parent → subtask. */
export function useTaskIndex() {
  const q = useTasks()
  const index = useMemo(() => {
    const all = q.data ?? []
    const children = new Map<string, Task[]>()
    const roots: Task[] = []
    for (const t of all) {
      if (t.parent_id) {
        const list = children.get(t.parent_id) ?? []
        list.push(t)
        children.set(t.parent_id, list)
      } else roots.push(t)
    }
    for (const list of children.values()) list.sort((a, b) => a.sort_order - b.sort_order)
    const byId = new Map(all.map((t) => [t.id, t]))
    return { roots, children, byId }
  }, [q.data])
  return { ...index, isLoading: q.isLoading, error: q.error }
}
