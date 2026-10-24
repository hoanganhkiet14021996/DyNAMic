import { ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/tasks'
import type { Task } from '../lib/types'
import { NotepadDoodle } from './Doodle'
import { TaskRow } from './TaskRow'

export function SectionLabel({ children, right, tone }: { children: ReactNode; right?: ReactNode; tone?: 'danger' }) {
  return (
    <div className={cn('label flex items-baseline justify-between px-5 pt-4 pb-1.5', tone === 'danger' && 'text-oxblood')}>
      <span>{children}</span>
      {right && <span className="font-medium tracking-normal normal-case">{right}</span>}
    </div>
  )
}

/** Danh sách việc kiểu giấy kẻ: mỗi dòng có một đường kẻ mảnh phía trên. */
export function TaskRows({
  tasks,
  childrenOf,
  showDue,
  dense,
}: {
  tasks: Task[]
  childrenOf: Map<string, Task[]>
  showDue?: boolean
  dense?: boolean
}) {
  return (
    <div>
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} subtasks={childrenOf.get(t.id) ?? []} showDue={showDue} dense={dense} />
      ))}
    </div>
  )
}

/** "Đã xong (n) ▸" gập sẵn. */
export function FoldedDone({
  tasks,
  childrenOf,
  label = 'Đã xong',
  dense,
}: {
  tasks: Task[]
  childrenOf: Map<string, Task[]>
  label?: string
  dense?: boolean
}) {
  const [open, setOpen] = useState(false)
  if (!tasks.length) return null
  return (
    <section className="mt-2 border-t border-rule">
      <button
        className="flex min-h-11 w-full items-center gap-1 px-5 text-left text-sm font-medium text-cap"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {label} ({tasks.length}){' '}
        <ChevronRight size={14} className={cn('transition-transform', open && 'rotate-90')} />
      </button>
      {open && <TaskRows tasks={tasks} childrenOf={childrenOf} showDue={!dense} dense={dense} />}
    </section>
  )
}

/** Trạng thái trống có hình vẽ nét tay + một câu + một lối đi tiếp. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: ReactNode
  children?: ReactNode
  action?: { to?: string; label: string; onClick?: () => void }
}) {
  return (
    <div className="px-8 pt-12 text-center">
      <NotepadDoodle className="mx-auto h-[110px] w-32 text-ink" />
      <h2 className="mt-4 font-serif text-xl leading-snug font-normal">{title}</h2>
      {children && <p className="mt-2 text-sm leading-relaxed text-body">{children}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn-outline mt-5">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-outline mt-5">
            {action.label}
          </button>
        ))}
    </div>
  )
}
