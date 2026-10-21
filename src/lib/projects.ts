import type { Task } from './types'

export const PROJECT_COLORS = ['#1e4f8f', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308']

/** % việc gốc đã xong (theo dữ liệu đang tải: việc đang mở + việc xong trong 90 ngày). */
export function completion(tasks: Task[]) {
  if (!tasks.length) return 0
  return Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)
}
