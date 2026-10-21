import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, SectionLabel, TaskRows } from '../components/TaskGroup'
import { dayLabel } from '../lib/dates'
import { compareTasks, useTaskIndex } from '../lib/tasks'
import type { Task } from '../lib/types'

export const BackToProjects = () => <Link to="/projects">‹ Dự án</Link>

export function InboxPage() {
  const { roots, children } = useTaskIndex()
  const inbox = roots.filter((t) => t.status !== 'done' && !t.area_id && !t.project_id).sort(compareTasks)
  return (
    <>
      <PageHeader label={<BackToProjects />} title="Inbox" />
      <p className="px-5 pb-2 text-[13px] text-cap">Việc chưa phân loại: ghi nhanh trước, sắp xếp sau.</p>
      {inbox.length ? (
        <TaskRows tasks={inbox} childrenOf={children} showDue />
      ) : (
        <EmptyState title="Inbox trống">Mọi việc đều đã có chỗ của nó.</EmptyState>
      )}
    </>
  )
}

export function DonePage() {
  const { roots, children } = useTaskIndex()
  const done = roots
    .filter((t) => t.status === 'done' && t.completed_at)
    .sort((a, b) => (a.completed_at! < b.completed_at! ? 1 : -1))
  const byDay = new Map<string, Task[]>()
  for (const t of done) {
    const key = format(new Date(t.completed_at!), 'yyyy-MM-dd')
    byDay.set(key, [...(byDay.get(key) ?? []), t])
  }
  return (
    <>
      <PageHeader label={<BackToProjects />} title="Đã xong" />
      <p className="px-5 pb-2 text-[13px] text-cap">90 ngày gần nhất.</p>
      {done.length === 0 && <EmptyState title="Chưa có việc nào hoàn thành">Xong việc nào, nó sẽ nằm ở đây.</EmptyState>}
      {[...byDay].map(([key, tasks]) => (
        <section key={key}>
          <SectionLabel right={`${tasks.length} việc`}>{dayLabel(new Date(key + 'T00:00'))}</SectionLabel>
          <TaskRows tasks={tasks} childrenOf={children} showDue={false} />
        </section>
      ))}
    </>
  )
}
