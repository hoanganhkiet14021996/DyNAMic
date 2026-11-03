import { format } from 'date-fns'
import { useState } from 'react'
import type { Task } from '../lib/types'
import { vi } from 'date-fns/locale'
import { useAuth } from '../auth/useAuth'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, FoldedDone, SortableTaskRows } from '../components/TaskGroup'
import { TodayMatrix } from '../components/TodayMatrix'
import { ProgressRing } from '../components/ui/ProgressRing'
import { WeekStrip } from '../components/WeekStrip'
import { useAreas, useProjects } from '../lib/api'
import { displayName } from '../lib/auth'
import { isDueToday, isOverdue } from '../lib/dates'
import { greetingPhrase, pickFocus, pickNudges, streakDays, todayActive, todaySummary, weekStrip } from '../lib/insights'
import { cn, compareManual, useTaskIndex } from '../lib/tasks'
import { useAddSheet } from '../lib/useSheets'
import { useNow } from '../lib/useNow'

type View = 'list' | 'matrix'
const VIEW_KEY = 'dyn.todayView'
const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'matrix' ? 'matrix' : 'list'
  } catch {
    return 'list'
  }
}

export function TodayPage() {
  const [view, setViewState] = useState<View>(readView)
  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* chế độ riêng tư: chỉ không nhớ được lựa chọn */
    }
  }
  const now = useNow()
  const { session } = useAuth()
  const add = useAddSheet()
  const { roots, children, isLoading } = useTaskIndex()
  const { data: projects } = useProjects()
  const { data: areas } = useAreas()

  const name = displayName(session?.user)
  const phrase = greetingPhrase(now)
  const focus = pickFocus(roots, now)
  const nudges = pickNudges(roots, focus, now)
  const sum = todaySummary(roots, now)
  const streak = streakDays(roots, now)

  const rest = todayActive(roots)
  const week = weekStrip(roots, now)
  // Chia theo khu vực (Công việc / Cá nhân / ...); trong mỗi nhóm theo thứ tự tự kéo thả
  const areaOf = (t: Task) => t.area_id ?? projects?.find((p) => p.id === t.project_id)?.area_id ?? null
  const groups = [
    ...(areas ?? []).map((a) => ({ key: a.id, title: `${a.icon ? a.icon + ' ' : ''}${a.name}`, tasks: rest.filter((t) => areaOf(t) === a.id) })),
    { key: 'none', title: 'Chưa phân loại', tasks: rest.filter((t) => !areaOf(t) || !areas?.some((a) => a.id === areaOf(t))) },
  ]
    .map((g) => ({ ...g, tasks: g.tasks.sort(compareManual) }))
    .filter((g) => g.tasks.length > 0)

  const empty = sum.total - sum.done === 0

  return (
    <>
      <PageHeader
        greet
        label={format(now, 'EEEE, dd/MM', { locale: vi })}
        title={
          <>
            Chào <span className="hl">{phrase}</span>
            {name ? `, ${name}` : ''}
          </>
        }
      />

      {isLoading ? null : (
        <>
          <div className="flex items-center gap-4 px-5 pb-4">
            {sum.total > 0 && (
              <ProgressRing value={(sum.done / sum.total) * 100}>
                {sum.done}/{sum.total}
              </ProgressRing>
            )}
            <div className="min-w-0">
              <div className="font-serif text-xl leading-tight">
                {sum.total === 0 ? 'Một ngày thong thả' : empty ? 'Xong hết rồi' : `Còn ${sum.total - sum.done} việc`}
              </div>
              <div className="mt-0.5 text-sm text-cap">
                {sum.total > 0 && `Đã xong ${sum.done} · `}
                {streak > 0 ? <span className="font-semibold text-teal">🔥 {streak} ngày liên tiếp</span> : 'Hoàn thành một việc để bắt đầu chuỗi'}
              </div>
            </div>
          </div>
          <WeekStrip days={week} />

          {nudges.length > 0 && (
            <ul className="pt-1.5">
              {nudges.map((n) => (
                <li key={n.key} className="flex items-center gap-2.5 px-5 py-2 text-sm text-body">
                  <span className="w-5 text-center">{n.icon}</span>
                  <span>
                    {n.pre}
                    {n.bold && <b className="font-semibold text-ink">{n.bold}</b>}
                    {n.post}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {rest.length > 0 && (
            <div className="flex gap-1.5 px-4 pt-3" role="tablist" aria-label="Cách xem">
              {(
                [
                  ['list', '☰ Danh sách'],
                  ['matrix', '▦ Ma trận'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    'min-h-11 rounded-full border px-4 text-sm font-medium',
                    view === v ? 'border-teal bg-teal font-semibold text-on-teal' : 'border-rule2 text-body',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {view === 'matrix' && rest.length > 0 && (
            <TodayMatrix tasks={[...rest].sort(compareManual)} childrenOf={children} focusId={focus?.id} />
          )}

          {view === 'list' && groups.map((g) => {
            const late = g.tasks.filter(isOverdue).length
            return (
              <section key={g.key}>
                <h2 className="flex items-baseline justify-between px-5 pt-5 pb-2">
                  <span className="font-serif text-xl leading-tight font-normal">{g.title}</span>
                  <span className={cn('text-sm', late ? 'font-semibold text-oxblood' : 'text-cap')}>
                    {late ? `${late} quá hạn` : `${g.tasks.length} việc`}
                  </span>
                </h2>
                <SortableTaskRows
                  tasks={g.tasks}
                  childrenOf={children}
                  showDue={(t) => !isDueToday(t) && isOverdue(t)}
                  highlightId={focus?.id}
                />
              </section>
            )
          })}

          {empty && sum.done > 0 && (
            <EmptyState
              title={
                <>
                  <span className="hl">Xong hết rồi</span>!
                </>
              }
              action={{ to: '/upcoming', label: 'Xem việc sắp tới' }}
            >
              Hôm nay không còn việc nào. Nghỉ một chút, hoặc kéo một việc từ Sắp tới sang.
            </EmptyState>
          )}
          {empty && sum.done === 0 && (
            <EmptyState title="Hôm nay chưa có việc nào" action={{ label: 'Thêm việc', onClick: add.open }}>
              Bấm nút + bất cứ lúc nào để ghi một việc mới.
            </EmptyState>
          )}

          <FoldedDone tasks={sum.doneTasks} childrenOf={children} label="Đã xong hôm nay" />
        </>
      )}
    </>
  )
}
