import { Archive, Trash2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, FoldedDone, SectionLabel, TaskRows } from '../components/TaskGroup'
import { ProgressLine } from '../components/ui/ProgressLine'
import { useAreas, useDeleteProject, useProjects, useUpdateProject } from '../lib/api'
import { compareTasks, useTaskIndex } from '../lib/tasks'
import { BackToProjects } from './ListPages'
import { completion } from '../lib/projects'

export function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: projects } = useProjects()
  const { data: areas } = useAreas()
  const { roots, children } = useTaskIndex()
  const update = useUpdateProject()
  const del = useDeleteProject()
  const project = projects?.find((p) => p.id === id)
  if (!project) return <EmptyState title="Không tìm thấy project" action={{ to: '/projects', label: 'Về Dự án' }} />

  const all = roots.filter((t) => t.project_id === project.id)
  const active = all.filter((t) => t.status !== 'done').sort(compareTasks)
  const done = all.filter((t) => t.status === 'done')
  const area = areas?.find((a) => a.id === project.area_id)

  return (
    <>
      <PageHeader
        label={<BackToProjects />}
        title={
          <span className="flex items-center gap-2">
            <span className="pcolor size-2.5 shrink-0 rounded-full" style={{ '--c': project.color } as CSSProperties} />
            {/* Bấm vào tên để sửa, rời ô là lưu */}
            <input
              key={project.id}
              defaultValue={project.name}
              aria-label="Tên project"
              enterKeyHint="done"
              onBlur={(e) => {
                const name = e.target.value.trim()
                if (name && name !== project.name) update.mutate({ id: project.id, name })
                else e.target.value = project.name
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </span>
        }
        right={
          <>
            <ConfirmButton
              className="btn-ghost min-h-11 px-3 text-xs"
              ariaLabel="Lưu trữ project (ẩn khỏi danh sách)"
              confirmLabel="Lưu trữ?"
              onConfirm={() => {
                update.mutate({ id: project.id, archived: true })
                navigate('/projects')
              }}
            >
              <Archive size={18} />
            </ConfirmButton>
            <ConfirmButton
              className="btn-danger min-h-11 px-3 text-xs"
              ariaLabel="Xóa project (các việc bên trong được giữ lại)"
              confirmLabel="Xóa project?"
              onConfirm={() => {
                del.mutate(project.id)
                navigate('/projects')
              }}
            >
              <Trash2 size={18} />
            </ConfirmButton>
          </>
        }
      />
      <div className="px-5 pb-2">
        <div className="mb-1.5 flex items-baseline justify-between text-xs text-cap">
          <span>
            {area ? `${area.icon ?? ''} ${area.name} · ` : ''}
            {done.length}/{all.length} việc
          </span>
          <span className="num font-serif text-lg text-teal">{completion(all)}%</span>
        </div>
        <ProgressLine value={completion(all)} color={project.color} />
      </div>
      {active.length ? (
        <TaskRows tasks={active} childrenOf={children} showDue />
      ) : (
        <EmptyState title="Chưa có việc nào đang mở">Bấm nút + để thêm việc cho project này.</EmptyState>
      )}
      <FoldedDone tasks={done} childrenOf={children} />
    </>
  )
}

export function AreaPage() {
  const { id } = useParams()
  const { data: areas } = useAreas()
  const { data: projects } = useProjects()
  const { roots, children } = useTaskIndex()
  const area = areas?.find((a) => a.id === id)
  if (!area) return <EmptyState title="Không tìm thấy khu vực" action={{ to: '/projects', label: 'Về Dự án' }} />

  const all = roots.filter((t) => t.area_id === area.id)
  const active = all.filter((t) => t.status !== 'done').sort(compareTasks)
  const ps = (projects ?? []).filter((p) => p.area_id === area.id && !p.archived)
  const loose = active.filter((t) => !t.project_id)

  return (
    <>
      <PageHeader label={<BackToProjects />} title={`${area.icon ?? ''} ${area.name}`} />
      <div className="px-5 pb-2">
        <div className="mb-1.5 flex items-baseline justify-between text-xs text-cap">
          <span>{active.length} việc đang mở</span>
          <span className="num font-serif text-lg text-teal">{completion(all)}%</span>
        </div>
        <ProgressLine value={completion(all)} />
      </div>
      {active.length === 0 && <EmptyState title="Chưa có việc nào">Bấm nút + để thêm việc vào khu vực này.</EmptyState>}
      {loose.length > 0 && (
        <>
          <SectionLabel>Không thuộc project</SectionLabel>
          <TaskRows tasks={loose} childrenOf={children} showDue />
        </>
      )}
      {ps.map((p) => {
        const list = active.filter((t) => t.project_id === p.id)
        if (!list.length) return null
        return (
          <section key={p.id}>
            <SectionLabel right={`${completion(all.filter((t) => t.project_id === p.id))}%`}>{p.name}</SectionLabel>
            <TaskRows tasks={list} childrenOf={children} showDue />
          </section>
        )
      })}
      <FoldedDone tasks={all.filter((t) => t.status === 'done')} childrenOf={children} />
    </>
  )
}
