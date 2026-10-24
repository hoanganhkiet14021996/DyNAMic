import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { FoldedDone, SectionLabel, TaskRows } from '../components/TaskGroup'
import { isOverdue } from '../lib/dates'
import { cn, compareTasks, useTaskIndex } from '../lib/tasks'
import type { Task } from '../lib/types'
import { useAddSheet } from '../lib/useSheets'
import { useNow } from '../lib/useNow'

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const WEEK = { weekStartsOn: 1 } as const
const key = (d: Date) => format(d, 'yyyy-MM-dd')

/** "Hôm nay · Thứ bảy 24/10" / "Thứ hai 26/10" */
function dayTitle(d: Date, now: Date) {
  const rel = ['Hôm qua', 'Hôm nay', 'Ngày mai'][differenceInCalendarDays(d, now) + 1]
  const name = format(d, 'EEEE dd/MM', { locale: vi }).replace(/^./, (c) => c.toUpperCase())
  return rel ? `${rel} · ${name}` : name
}

/**
 * Kiểu TickTick: lịch cả tháng ở trên (chấm màu = có việc), danh sách việc của ngày đang chọn ở dưới.
 * Ngày đang chọn nằm trên URL (?day=yyyy-MM-dd) để bảng "Thêm việc" tự đặt hạn vào ngày đó.
 */
export function UpcomingPage() {
  const now = useNow()
  const add = useAddSheet()
  const [params, setParams] = useSearchParams()
  const { roots, children } = useTaskIndex()

  const todayKey = key(now)
  const selKey = params.get('day') ?? todayKey
  const selected = parseISO(selKey)
  const month = params.get('month') ? parseISO(params.get('month') + '-01') : startOfMonth(selected)

  const setView = (day: string, m: Date) => {
    const next = new URLSearchParams(params)
    next.set('day', day)
    next.set('month', format(m, 'yyyy-MM'))
    setParams(next, { replace: true })
  }
  const pick = (d: Date) => setView(key(d), startOfMonth(d))
  const shiftMonth = (n: number) => {
    const m = addMonths(month, n)
    // giữ ngày đang chọn nếu nó thuộc tháng mới; không thì chọn ngày 1 (hoặc hôm nay nếu là tháng này)
    const day = isSameMonth(selected, m) ? selKey : isSameMonth(now, m) ? todayKey : key(m)
    setView(day, m)
  }

  // việc theo ngày (một lần duyệt cho cả lưới)
  const byDay = new Map<string, Task[]>()
  for (const t of roots) {
    if (!t.due_at) continue
    const k = key(new Date(t.due_at))
    const list = byDay.get(k) ?? []
    list.push(t)
    byDay.set(k, list)
  }

  const gridStart = startOfWeek(startOfMonth(month), WEEK)
  const gridEnd = endOfWeek(endOfMonth(month), WEEK)
  const cells: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) cells.push(d)

  const dayTasks = byDay.get(selKey) ?? []
  const open = dayTasks.filter((t) => t.status !== 'done').sort(compareTasks)
  const done = dayTasks.filter((t) => t.status === 'done')
  // Hôm nay: kéo cả việc quá hạn của những ngày trước vào đầu danh sách
  const overdue =
    selKey === todayKey ? roots.filter((t) => isOverdue(t) && key(new Date(t.due_at!)) !== todayKey).sort(compareTasks) : []

  // vuốt ngang trên lịch để đổi tháng
  const touch = useRef<{ x: number; y: number } | null>(null)

  return (
    <>
      <PageHeader
        label="Sắp tới"
        title={
          <>
            Tháng {month.getMonth() + 1}
            <span className="ml-1.5 text-base text-cap">{format(month, 'yyyy')}</span>
          </>
        }
        right={
          <>
            {(selKey !== todayKey || !isSameMonth(month, now)) && (
              <button onClick={() => pick(now)} className="min-h-11 rounded-full px-3 text-sm font-semibold text-teal">
                Hôm nay
              </button>
            )}
            <button onClick={() => shiftMonth(-1)} aria-label="Tháng trước" className="flex size-11 items-center justify-center text-body">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => shiftMonth(1)} aria-label="Tháng sau" className="flex size-11 items-center justify-center text-body">
              <ChevronRight size={20} />
            </button>
          </>
        }
      />

      <div
        className="px-2 pb-2"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const s = touch.current
          touch.current = null
          if (!s) return
          const dx = e.changedTouches[0].clientX - s.x
          const dy = e.changedTouches[0].clientY - s.y
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) shiftMonth(dx < 0 ? 1 : -1)
        }}
      >
        <div className="grid grid-cols-7 pb-1 text-center text-xs font-semibold text-cap">
          {DOW.map((d) => (
            <span key={d}>
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7" role="group" aria-label="Chọn ngày">
          {cells.map((d) => {
            const k = key(d)
            const on = k === selKey
            const isToday = k === todayKey
            const tasks = byDay.get(k) ?? []
            const pending = tasks.filter((t) => t.status !== 'done')
            const late = pending.some(isOverdue)
            return (
              <button
                key={k}
                onClick={() => pick(d)}
                aria-pressed={on}
                aria-label={`${format(d, 'dd/MM')}${pending.length ? `, ${pending.length} việc` : ''}`}
                className={cn('flex h-11 flex-col items-center pt-1', !isSameMonth(d, month) && 'opacity-35')}
              >
                <span
                  className={cn(
                    'num flex size-[27px] items-center justify-center rounded-full text-sm',
                    on ? 'bg-teal font-semibold text-on-teal' : isToday ? 'font-bold text-teal ring-1 ring-teal' : 'text-ink',
                  )}
                >
                  {d.getDate()}
                </span>
                {/* một chấm: đỏ = có việc quá hạn, teal = có việc, nhạt = đã xong hết */}
                <i
                  className={cn(
                    'mt-[3px] size-[5px] rounded-full',
                    late ? 'bg-oxblood' : pending.length ? 'bg-teal' : tasks.length ? 'bg-rule2' : 'bg-transparent',
                  )}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-rule2">
        {overdue.length > 0 && (
          <>
            <SectionLabel tone="danger" right={`${overdue.length} việc`}>
              Quá hạn
            </SectionLabel>
            <TaskRows tasks={overdue} childrenOf={children} showDue dense />
          </>
        )}

        <SectionLabel right={open.length ? `${open.length} việc` : undefined}>{dayTitle(selected, now)}</SectionLabel>
        <TaskRows tasks={open} childrenOf={children} dense />
        <button
          onClick={add.open}
          className="flex min-h-11 w-full items-center gap-3 border-t border-rule px-5 text-left text-sm text-cap"
        >
          <Plus size={18} className="text-ring" />
          {open.length ? 'Thêm việc' : 'Chưa có việc · thêm việc vào ngày này'}
        </button>

        <FoldedDone tasks={done} childrenOf={children} dense />
      </div>
    </>
  )
}
