// Logic "thông minh" của màn Hôm nay: toàn bộ là hàm thuần (không gọi API, không phụ thuộc React).
import { differenceInMinutes, format, isSameDay, startOfDay, subDays } from 'date-fns'
import { dueLabel, isDueToday, isOverdue } from './dates'
import type { Task } from './types'

export type GreetingPhrase = 'buổi sáng' | 'buổi trưa' | 'buổi chiều' | 'buổi tối'

/** Cụm từ chào theo giờ trong ngày (cụm này sẽ được bôi dạ quang trọn cả cụm). */
export function greetingPhrase(now: Date): GreetingPhrase {
  const h = now.getHours()
  if (h >= 4 && h < 11) return 'buổi sáng'
  if (h >= 11 && h < 14) return 'buổi trưa'
  if (h >= 14 && h < 18) return 'buổi chiều'
  return 'buổi tối'
}

const byPriorityThenDue = (a: Task, b: Task) =>
  b.priority - a.priority || (a.due_at ?? '').localeCompare(b.due_at ?? '') || a.sort_order - b.sort_order

/** Các việc đang mở cần xử lý hôm nay: quá hạn + đến hạn hôm nay. */
export function todayActive(roots: Task[]): Task[] {
  return roots.filter((t) => t.status !== 'done' && (isOverdue(t) || isDueToday(t)))
}

/**
 * Chọn "Nên làm trước":
 * 1) việc quá hạn (ưu tiên cao nhất, rồi hạn cũ nhất)
 * 2) việc có giờ hôm nay chưa tới (gần nhất)
 * 3) việc ưu tiên trung bình trở lên
 * 4) việc còn lại
 */
export function pickFocus(active: Task[], now: Date): Task | null {
  const pool = todayActive(active)
  if (!pool.length) return null
  const overdue = pool.filter(isOverdue).sort(byPriorityThenDue)
  if (overdue.length) return overdue[0]
  const timed = pool
    .filter((t) => !t.all_day && t.due_at && new Date(t.due_at) >= now)
    .sort((a, b) => a.due_at!.localeCompare(b.due_at!))
  if (timed.length) return timed[0]
  const important = pool.filter((t) => t.priority >= 2).sort(byPriorityThenDue)
  if (important.length) return important[0]
  return [...pool].sort((a, b) => a.sort_order - b.sort_order)[0]
}

/** Dòng phụ dưới tên việc trên thẻ "Nên làm trước". */
export function focusReason(t: Task): string {
  if (isOverdue(t)) return `Quá hạn từ ${dueLabel(t).toLowerCase()}`
  if (t.due_at) return `Hạn ${dueLabel(t).toLowerCase()}`
  return t.priority >= 3 ? 'Ưu tiên cao' : 'Việc nên xong hôm nay'
}

export interface Nudge {
  key: string
  icon: string
  pre?: string
  bold?: string
  post?: string
}

/** Tối đa 2 nhắc phụ. */
export function pickNudges(roots: Task[], focus: Task | null, now: Date): Nudge[] {
  const open = roots.filter((t) => t.status !== 'done')
  const out: Nudge[] = []

  const soon = open
    .filter((t) => !t.all_day && t.due_at && t.id !== focus?.id)
    .map((t) => ({ t, mins: differenceInMinutes(new Date(t.due_at!), now) }))
    .filter((x) => x.mins > 0 && x.mins <= 120)
    .sort((a, b) => a.mins - b.mins)[0]
  if (soon)
    out.push({
      key: 'soon',
      icon: '⏰',
      bold: `${format(new Date(soon.t.due_at!), 'HH:mm')} ${soon.t.title}`,
      post: ` · còn ${soon.mins} phút`,
    })

  const inbox = open.filter((t) => !t.area_id && !t.project_id).length
  if (inbox > 0) out.push({ key: 'inbox', icon: '📥', pre: 'Inbox có ', bold: `${inbox} việc`, post: ' chưa phân loại' })

  if (!todayActive(open).length && open.some((t) => t.due_at))
    out.push({ key: 'pull', icon: '💡', pre: 'Hôm nay trống. ', bold: 'Kéo một việc từ Sắp tới sang?' })

  return out.slice(0, 2)
}

/** Số ngày liên tiếp có ít nhất một việc hoàn thành (tính đến hôm nay, hoặc đến hôm qua nếu hôm nay chưa làm gì). */
export function streakDays(roots: Task[], now: Date): number {
  const done = roots.filter((t) => t.status === 'done' && t.completed_at).map((t) => new Date(t.completed_at!))
  const hasDay = (d: Date) => done.some((c) => isSameDay(c, d))
  let day = startOfDay(now)
  if (!hasDay(day)) day = subDays(day, 1)
  let n = 0
  while (hasDay(day) && n < 365) {
    n++
    day = subDays(day, 1)
  }
  return n
}

/** Đã xong hôm nay / tổng việc của hôm nay (đã xong + còn lại). */
export function todaySummary(roots: Task[], now: Date) {
  const doneToday = roots.filter((t) => t.status === 'done' && t.completed_at && isSameDay(new Date(t.completed_at), now))
  const remaining = todayActive(roots)
  return { done: doneToday.length, total: doneToday.length + remaining.length, doneTasks: doneToday }
}

export interface WeekDay {
  date: Date
  label: string
  done: number
  isToday: boolean
  isFuture: boolean
}

const WEEK_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** 7 ngày của tuần hiện tại (T2 → CN) kèm số việc đã hoàn thành mỗi ngày. */
export function weekStrip(roots: Task[], now: Date): WeekDay[] {
  const today = startOfDay(now)
  const monday = subDays(today, (today.getDay() + 6) % 7)
  const doneDates = roots.filter((t) => t.status === 'done' && t.completed_at).map((t) => new Date(t.completed_at!))
  return WEEK_LABELS.map((label, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    return {
      date,
      label,
      done: doneDates.filter((c) => isSameDay(c, date)).length,
      isToday: isSameDay(date, today),
      isFuture: date > today,
    }
  })
}
