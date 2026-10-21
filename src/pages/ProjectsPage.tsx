import { Plus, Search } from 'lucide-react'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, TaskRows } from '../components/TaskGroup'
import { ProgressLine } from '../components/ui/ProgressLine'
import { useAreas, useCreateArea, useCreateProject, useProjects } from '../lib/api'
import { cn, compareTasks, newId, useTaskIndex } from '../lib/tasks'
import { completion, PROJECT_COLORS } from '../lib/projects'

/** Bỏ dấu tiếng Việt để tìm "hop" ra "họp". */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

export function ProjectsPage() {
  const { roots, children, isLoading } = useTaskIndex()
  const { data: areas } = useAreas()
  const { data: projects } = useProjects()
  const [q, setQ] = useState('')

  const needle = fold(q.trim())
  const results = needle
    ? roots.filter((t) => fold(`${t.title} ${t.notes ?? ''}`).includes(needle)).sort(compareTasks)
    : []
  const inbox = roots.filter((t) => t.status !== 'done' && !t.area_id && !t.project_id).length
  const doneCount = roots.filter((t) => t.status === 'done').length

  return (
    <>
      <PageHeader label="Mọi việc ở một chỗ" title="Dự án" />

      <label className="mx-5 flex min-h-11 items-center gap-2.5 rounded-[10px] border border-rule2 px-3.5 text-sm text-cap focus-within:border-brand">
        <Search size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm việc… (gõ “hop” ra “họp”)"
          aria-label="Tìm việc"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-cap"
        />
      </label>

      {needle ? (
        <div className="mt-3">
          {results.length ? (
            <TaskRows tasks={results} childrenOf={children} showDue />
          ) : (
            <EmptyState title="Không tìm thấy">Thử gõ ít chữ hơn hoặc bỏ dấu.</EmptyState>
          )}
        </div>
      ) : (
        <>
          <div className="mx-5 mt-3 grid grid-cols-2 gap-2.5">
            <Link to="/inbox" className="flex min-h-12 items-center justify-between rounded-[10px] border border-rule px-3.5 text-sm font-semibold">
              Inbox <span className="num font-medium text-cap">{inbox}</span>
            </Link>
            <Link to="/done" className="flex min-h-12 items-center justify-between rounded-[10px] border border-rule px-3.5 text-sm font-semibold">
              Đã xong <span className="num font-medium text-cap">{doneCount}</span>
            </Link>
          </div>

          {!isLoading &&
            areas?.map((a) => {
              const areaRoots = roots.filter((t) => t.area_id === a.id)
              const ps = (projects ?? []).filter((p) => p.area_id === a.id && !p.archived)
              return (
                <section key={a.id} className="mx-5 mt-5">
                  <Link to={`/area/${a.id}`} className="flex items-baseline justify-between border-b border-ink pb-1.5">
                    <h2 className="font-serif text-lg font-normal">
                      {a.icon} {a.name}
                    </h2>
                    <span className="num font-serif text-[17px] text-teal">{completion(areaRoots)}%</span>
                  </Link>
                  {ps.map((p) => {
                    const pr = roots.filter((t) => t.project_id === p.id)
                    return (
                      <Link key={p.id} to={`/project/${p.id}`} className="block pt-3 pb-0.5">
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-medium">
                          <span className="inline-flex items-center gap-2">
                            <span className="pcolor size-2 rounded-full" style={{ '--c': p.color } as CSSProperties} />
                            {p.name}
                          </span>
                          <span className="text-xs text-cap">
                            {pr.filter((t) => t.status === 'done').length}/{pr.length} việc
                          </span>
                        </div>
                        <ProgressLine value={completion(pr)} color={p.color} />
                      </Link>
                    )
                  })}
                  <NewProject areaId={a.id} count={ps.length} />
                </section>
              )
            })}

          <NewArea count={areas?.length ?? 0} />
        </>
      )}
    </>
  )
}

function NewProject({ areaId, count }: { areaId: string; count: number }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateProject()

  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    create.mutate({ id: newId(), name: n, area_id: areaId, color: PROJECT_COLORS[count % PROJECT_COLORS.length] })
    setName('')
    setOpen(false)
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="mt-2 flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-cap">
        <Plus size={15} /> Project mới
      </button>
    )
  return (
    <form onSubmit={submit} className="mt-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => !name.trim() && setOpen(false)}
        placeholder="Tên project rồi Enter"
        aria-label="Tên project"
        className="input"
        enterKeyHint="done"
      />
    </form>
  )
}

function NewArea({ count }: { count: number }) {
  const [name, setName] = useState('')
  const create = useCreateArea()
  function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    create.mutate({ id: newId(), name: n, icon: '📁', sort_order: count + 1 })
    setName('')
  }
  return (
    <form onSubmit={submit} className={cn('mx-5 mt-6 mb-2')}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="+ Khu vực mới (vd: Học tập, Sức khỏe)"
        aria-label="Khu vực mới"
        className="input text-center"
        enterKeyHint="done"
      />
    </form>
  )
}
