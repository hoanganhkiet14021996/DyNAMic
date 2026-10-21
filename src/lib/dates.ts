import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isBefore,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Task } from './types'

export const today = () => startOfDay(new Date())

/** Task quá hạn: việc cả ngày thì tính theo ngày, việc có giờ thì tính theo giờ. */
export function isOverdue(t: Pick<Task, 'due_at' | 'all_day' | 'status'>) {
  if (!t.due_at || t.status === 'done') return false
  const due = new Date(t.due_at)
  return t.all_day ? isBefore(due, today()) : isBefore(due, new Date())
}

export function isDueToday(t: Pick<Task, 'due_at'>) {
  return !!t.due_at && isToday(new Date(t.due_at))
}

export function isDueWithin(t: Pick<Task, 'due_at'>, days: number) {
  if (!t.due_at) return false
  const due = new Date(t.due_at)
  return !isBefore(due, today()) && isBefore(due, endOfDay(addDays(today(), days - 1)))
}

export function dayLabel(d: Date) {
  if (isToday(d)) return 'Hôm nay'
  if (isTomorrow(d)) return 'Ngày mai'
  if (isYesterday(d)) return 'Hôm qua'
  const diff = differenceInCalendarDays(d, today())
  if (diff > 0 && diff < 7) return format(d, 'EEEE', { locale: vi })
  return format(d, 'dd/MM', { locale: vi })
}

export function dueLabel(t: Pick<Task, 'due_at' | 'all_day'>) {
  if (!t.due_at) return ''
  const d = new Date(t.due_at)
  return t.all_day ? dayLabel(d) : `${dayLabel(d)} ${format(d, 'HH:mm')}`
}

/** Giờ dạng 09:30 (giờ địa phương). */
export const formatClock = (iso: string) => format(new Date(iso), 'HH:mm')

export function longDayLabel(d: Date) {
  return `${dayLabel(d)} · ${format(d, 'EEEE, dd/MM/yyyy', { locale: vi })}`
}

/** Chuyển giá trị ISO sang chuỗi cho input type=date / type=time (giờ địa phương). */
export function toDateInput(iso: string | null) {
  return iso ? format(new Date(iso), 'yyyy-MM-dd') : ''
}
export function toTimeInput(iso: string | null) {
  return iso ? format(new Date(iso), 'HH:mm') : ''
}

/** Ghép date + time (giờ địa phương) thành ISO. Không có giờ → việc cả ngày (00:00). */
export function fromInputs(date: string, time: string): { due_at: string | null; all_day: boolean } {
  if (!date) return { due_at: null, all_day: false }
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time ? time.split(':').map(Number) : [0, 0]
  return { due_at: new Date(y, m - 1, d, hh, mm).toISOString(), all_day: !time }
}
