import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useAuth } from '../auth/useAuth'
import { FocusCard } from '../components/FocusCard'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, FoldedDone, SectionLabel, TaskRows } from '../components/TaskGroup'
import { ProgressLine } from '../components/ui/ProgressLine'
import { useProjects } from '../lib/api'
import { displayName } from '../lib/auth'
import { isOverdue } from '../lib/dates'
import { greetingPhrase, pickFocus, pickNudges, streakDays, todayActive, todaySummary } from '../lib/insights'
import { compareTasks, useTaskIndex } from '../lib/tasks'
import { useAddSheet } from '../lib/useSheets'
import { useNow } from '../lib/useNow'

export function TodayPage() {
  const now = useNow()
  const { session } = useAuth()
  const add = useAddSheet()
  const { roots, children, isLoading } = useTaskIndex()
  const { data: projects } = useProjects()

  const name = displayName(session?.user)
  const phrase = greetingPhrase(now)
  const focus = pickFocus(roots, now)
  const nudges = pickNudges(roots, focus, now)
  const sum = todaySummary(roots, now)
  const streak = streakDays(roots, now)

  const rest = todayActive(roots)
    .filter((t) => t.id !== focus?.id)
    .sort(compareTasks)
  const overdue = rest.filter(isOverdue)
  const timed = rest.filter((t) => !isOverdue(t) && !t.all_day && t.due_at)
  const allDay = rest.filter((t) => !isOverdue(t) && (t.all_day || !t.due_at))

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
          {sum.total > 0 && (
            <div className="flex items-center gap-3 px-5 pb-3">
              <div className="num font-serif text-xl leading-none whitespace-nowrap">
                {sum.done}/{sum.total}
                <small className="ml-1 font-sans text-xs font-medium text-cap">việc xong</small>
              </div>
              <ProgressLine value={(sum.done / sum.total) * 100} className="flex-1" />
              {streak > 0 && <div className="text-xs font-semibold whitespace-nowrap text-teal">🔥 {streak} ngày</div>}
            </div>
          )}

          {focus && <FocusCard task={focus} project={projects?.find((p) => p.id === focus.project_id)?.name} />}

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

          {overdue.length > 0 && (
            <>
              <SectionLabel tone="danger">Quá hạn</SectionLabel>
              <TaskRows tasks={overdue} childrenOf={children} showDue />
            </>
          )}
          {timed.length > 0 && (
            <>
              <SectionLabel>Có giờ</SectionLabel>
              <TaskRows tasks={timed} childrenOf={children} />
            </>
          )}
          {allDay.length > 0 && (
            <>
              <SectionLabel>Trong ngày</SectionLabel>
              <TaskRows tasks={allDay} childrenOf={children} />
            </>
          )}

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
