import { addDays, format, startOfDay } from 'date-fns'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, SectionLabel, TaskRows } from '../components/TaskGroup'
import { cn, compareTasks, useTaskIndex } from '../lib/tasks'
import { dayLabel } from '../lib/dates'
import { useNow } from '../lib/useNow'

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DAYS = 14

export function UpcomingPage() {
  const now = useNow()
  const { roots, children, isLoading } = useTaskIndex()
  const [selected, setSelected] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const active = roots.filter((t) => t.status !== 'done')
  const start = startOfDay(now)
  const key = (d: Date) => format(d, 'yyyy-MM-dd')
  const forDay = (d: Date) =>
    active
      .filter((t) => t.due_at && key(new Date(t.due_at)) === key(d))
      .sort(compareTasks)

  const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i))
  const groups = days.map((d) => ({ d, tasks: forDay(d) })).filter((g) => g.tasks.length)
  const noDate = active.filter((t) => !t.due_at).sort(compareTasks)

  const pick = (d: Date) => {
    setSelected(key(d))
    document.getElementById(`day-${key(d)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <PageHeader label={`${DAYS} ngày tới`} title="Sắp tới" />

      <div className="grid grid-cols-7 gap-1 px-3 pb-2" role="group" aria-label="Chọn ngày">
        {days.slice(0, 7).map((d) => {
          const on = key(d) === selected
          const has = forDay(d).length > 0
          return (
            <button
              key={key(d)}
              onClick={() => pick(d)}
              aria-pressed={on}
              className={cn(
                'flex min-h-14 flex-col items-center gap-0.5 rounded-[10px] py-1.5 text-xs font-medium',
                on ? 'bg-teal text-on-teal' : 'text-cap',
              )}
            >
              <span>{DOW[d.getDay()]}</span>
              <b className={cn('text-[15px] font-semibold', on ? 'text-on-teal' : 'text-ink')}>{d.getDate()}</b>
              <i className={cn('size-[5px] rounded-full', has ? (on ? 'bg-on-teal' : 'bg-cap') : 'bg-transparent')} />
            </button>
          )
        })}
      </div>

      {!isLoading && groups.length === 0 && noDate.length === 0 && (
        <EmptyState title="Chưa có việc nào sắp tới">Bấm nút + để ghi việc và đặt hạn cho nó.</EmptyState>
      )}

      {groups.map(({ d, tasks }) => (
        <section key={key(d)} id={`day-${key(d)}`} className="scroll-mt-4">
          <div className="flex items-baseline justify-between px-5 pt-4 pb-1.5">
            <h2 className="font-serif text-base font-normal">{dayLabel(d)}</h2>
            <span className="text-xs text-cap">
              {format(d, 'dd/MM')} · {tasks.length} việc
            </span>
          </div>
          <TaskRows tasks={tasks} childrenOf={children} />
        </section>
      ))}

      {noDate.length > 0 && (
        <>
          <SectionLabel right={`${noDate.length} việc`}>Chưa có deadline</SectionLabel>
          <TaskRows tasks={noDate} childrenOf={children} />
        </>
      )}
    </>
  )
}
