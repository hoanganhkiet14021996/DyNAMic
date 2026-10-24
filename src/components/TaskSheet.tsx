import { format } from 'date-fns'
import { ChevronRight, Plus, X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useAreas,
  useCreateTag,
  useCreateTask,
  useDeleteTask,
  useProjects,
  useSetTaskTags,
  useTags,
  useUpdateTask,
} from '../lib/api'
import { useTaskActions } from '../lib/actions'
import { dueLabel, fromInputs, isOverdue, toDateInput, toTimeInput } from '../lib/dates'
import { cn, newId, taskProgress, useTaskIndex } from '../lib/tasks'
import { PRIORITIES, STATUSES, type Task, type TaskInput } from '../lib/types'
import { useOpenTask } from '../lib/useOpenTask'
import { PenCheck } from './PenCheck'
import { Chip } from './ui/Chip'
import { ProgressLine } from './ui/ProgressLine'
import { Sheet } from './ui/Sheet'

/** Bảng "Chi tiết việc": mở khi URL có ?task=<id>. */
export function TaskSheetHost() {
  const [params] = useSearchParams()
  const open = useOpenTask()
  const { byId, children } = useTaskIndex()
  const id = params.get('task')
  const task = id ? byId.get(id) : undefined
  return (
    <Sheet open={!!task} onOpenChange={(o) => !o && open(task?.parent_id ?? null)} title="Chi tiết việc">
      {task && <TaskBody key={task.id} task={task} subtasks={children.get(task.id) ?? []} />}
    </Sheet>
  )
}

type Panel = 'due' | 'area' | 'prio' | null

const PRIO_CLS = ['', 'border-prio-low text-prio-low', 'border-prio-mid text-prio-mid', 'border-prio-high text-prio-high']

function TaskBody({ task, subtasks }: { task: Task; subtasks: Task[] }) {
  const update = useUpdateTask()
  const actions = useTaskActions()
  const open = useOpenTask()
  const { data: areas } = useAreas()
  const { data: projects } = useProjects()
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [panel, setPanel] = useState<Panel>(null)
  const [more, setMore] = useState(false)
  const [date, setDate] = useState(toDateInput(task.due_at))
  const [time, setTime] = useState(task.all_day ? '' : toTimeInput(task.due_at))

  const save = (patch: TaskInput) => update.mutate({ id: task.id, patch })
  const saveDue = (d: string, t: string) => save(fromInputs(d, t))
  const progress = taskProgress(task, subtasks)
  const area = areas?.find((a) => a.id === task.area_id)
  const isSub = !!task.parent_id
  const toggle = (p: Panel) => setPanel(panel === p ? null : p)

  const quickDate = (offset: number) => {
    const d = format(new Date(Date.now() + offset * 86_400_000), 'yyyy-MM-dd')
    setDate(d)
    saveDue(d, time)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="pt-1.5">
          <PenCheck task={task} size={28} onToggle={() => save({ status: task.status === 'done' ? 'todo' : 'done' })} />
        </div>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title.trim() !== task.title && save({ title: title.trim() })}
          rows={1}
          aria-label="Tên việc"
          className="w-full resize-none bg-transparent font-serif text-xl leading-snug outline-none [field-sizing:content]"
        />
      </div>

      {/* Hàng chip: bấm chip nào sửa chip đó */}
      <div className="flex flex-wrap gap-2">
        <Chip
          selected={panel === 'due'}
          onClick={() => toggle('due')}
          className={cn(!panel && isOverdue(task) && 'border-oxblood text-oxblood')}
        >
          📅 {task.due_at ? dueLabel(task) : 'Thêm hạn'}
        </Chip>
        {!isSub && (
          <Chip selected={panel === 'area'} onClick={() => toggle('area')}>
            {area ? `${area.icon ?? ''} ${area.name}` : 'Inbox'}
          </Chip>
        )}
        <Chip selected={panel === 'prio'} onClick={() => toggle('prio')} className={cn(panel !== 'prio' && PRIO_CLS[task.priority])}>
          ⚑ {PRIORITIES[task.priority].label === 'Không' ? 'Ưu tiên' : PRIORITIES[task.priority].label}
        </Chip>
      </div>

      {panel === 'due' && (
        <div className="space-y-2.5 rounded-[10px] border border-rule p-3">
          <div className="flex flex-wrap gap-2">
            <Chip onClick={() => quickDate(0)}>Hôm nay</Chip>
            <Chip onClick={() => quickDate(1)}>Ngày mai</Chip>
            <Chip onClick={() => quickDate(7)}>Tuần sau</Chip>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              aria-label="Ngày"
              className="input"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                if (!e.target.value) setTime('')
                saveDue(e.target.value, e.target.value ? time : '')
              }}
            />
            <input
              type="time"
              aria-label="Giờ (bỏ trống = cả ngày)"
              className="input"
              value={time}
              disabled={!date}
              onChange={(e) => {
                setTime(e.target.value)
                saveDue(date, e.target.value)
              }}
            />
          </div>
          {date && (
            <button
              className="btn-ghost -ml-2 min-h-11 text-oxblood"
              onClick={() => {
                setDate('')
                setTime('')
                saveDue('', '')
              }}
            >
              Bỏ hạn
            </button>
          )}
        </div>
      )}
      {panel === 'area' && !isSub && (
        <div className="space-y-2.5 rounded-[10px] border border-rule p-3">
          <div className="flex flex-wrap gap-2">
            <Chip selected={!task.area_id} onClick={() => save({ area_id: null, project_id: null })}>
              Inbox
            </Chip>
            {areas?.map((a) => (
              <Chip
                key={a.id}
                selected={task.area_id === a.id}
                onClick={() => {
                  const project = projects?.find((p) => p.id === task.project_id)
                  save({ area_id: a.id, project_id: project && project.area_id !== a.id ? null : task.project_id })
                }}
              >
                {a.icon} {a.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {panel === 'prio' && (
        <div className="flex flex-wrap gap-2 rounded-[10px] border border-rule p-3">
          {PRIORITIES.map((p) => (
            <Chip key={p.value} selected={task.priority === p.value} onClick={() => save({ priority: p.value })}>
              {p.label}
            </Chip>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="label">Tiến độ</span>
          <span className="num font-serif text-lg text-teal">{progress}%</span>
        </div>
        {subtasks.length > 0 || task.status === 'done' ? (
          <ProgressLine value={progress} />
        ) : (
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={task.progress}
            aria-label="Tiến độ"
            onChange={(e) => save({ progress: Number(e.target.value) })}
            className="w-full accent-[var(--teal)]"
          />
        )}
      </div>

      {!isSub && <Subtasks parent={task} subtasks={subtasks} />}

      <button
        type="button"
        onClick={() => setMore(!more)}
        aria-expanded={more}
        className="flex min-h-11 w-full items-center gap-1 border-t border-rule pt-2 text-sm font-medium text-cap"
      >
        <ChevronRight size={14} className={cn('transition-transform', more && 'rotate-90')} /> Thêm chi tiết
        {!more && <span className="font-normal"> · project, tag, ghi chú</span>}
      </button>

      {more && (
        <div className="space-y-4">
          <Field label="Trạng thái">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Chip key={s.value} selected={task.status === s.value} onClick={() => save({ status: s.value })}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Field>
          {!isSub && (
            <>
              <Field label="Project">
                <select
                  className="input"
                  value={task.project_id ?? ''}
                  onChange={(e) => {
                    const project = projects?.find((p) => p.id === e.target.value)
                    save({ project_id: project?.id ?? null, area_id: project ? project.area_id : task.area_id })
                  }}
                >
                  <option value="">— Không —</option>
                  {projects
                    ?.filter((p) => !p.archived && (!task.area_id || p.area_id === task.area_id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </Field>
              <div className="flex flex-wrap gap-2">
                <Chip selected={task.is_urgent} onClick={() => save({ is_urgent: !task.is_urgent })}>
                  🔥 Khẩn cấp
                </Chip>
                <Chip selected={task.is_important} onClick={() => save({ is_important: !task.is_important })}>
                  ⭐ Quan trọng
                </Chip>
              </div>
              <TagPicker task={task} />
            </>
          )}
          <Field label="Ghi chú">
            <textarea
              className="input min-h-24"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (task.notes ?? '') && save({ notes: notes || null })}
              placeholder="Chi tiết, link, ghi chú…"
            />
          </Field>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-sm text-cap">
        <span>
          Tạo {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm')}
          {task.completed_at && ` · Xong ${format(new Date(task.completed_at), 'dd/MM HH:mm')}`}
        </span>
        <button
          className="btn-danger min-h-11 px-2"
          onClick={() => {
            open(task.parent_id ?? null)
            actions.remove(task)
          }}
        >
          Xóa
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="label mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function TagPicker({ task }: { task: Task }) {
  const { data: tags } = useTags()
  const setTags = useSetTaskTags()
  const createTag = useCreateTag()
  const [name, setName] = useState('')
  const selected = new Set(task.task_tags.map((t) => t.tag_id))
  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setTags.mutate({ taskId: task.id, tagIds: [...next] })
  }
  async function add(e: FormEvent) {
    e.preventDefault()
    const n = name.trim().replace(/^#/, '')
    if (!n) return
    setName('')
    const existing = tags?.find((t) => t.name.toLowerCase() === n.toLowerCase())
    const id = existing ? existing.id : (await createTag.mutateAsync({ name: n })).id
    if (!selected.has(id)) setTags.mutate({ taskId: task.id, tagIds: [...selected, id] })
  }
  return (
    <Field label="Tag">
      <div className="flex flex-wrap items-center gap-2">
        {tags?.map((t) => (
          <Chip key={t.id} selected={selected.has(t.id)} onClick={() => toggle(t.id)}>
            #{t.name}
          </Chip>
        ))}
        <form onSubmit={add}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="+ tag mới"
            aria-label="Tag mới"
            className="h-10 w-28 rounded-[10px] border border-dashed border-rule2 bg-transparent px-3 text-sm outline-none placeholder:text-cap focus:border-brand"
          />
        </form>
      </div>
    </Field>
  )
}

function Subtasks({ parent, subtasks }: { parent: Task; subtasks: Task[] }) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const del = useDeleteTask()
  const [text, setText] = useState('')

  function add(e: FormEvent) {
    e.preventDefault()
    const title = text.trim()
    if (!title) return
    setText('')
    create.mutate({ id: newId(), title, parent_id: parent.id, area_id: parent.area_id, project_id: parent.project_id })
  }

  return (
    <div>
      <div className="label mb-1">
        Subtask / checklist {subtasks.length > 0 && `(${subtasks.filter((s) => s.status === 'done').length}/${subtasks.length})`}
      </div>
      <div>
        {subtasks.map((s) => (
          <div key={s.id} className="flex min-h-11 items-center gap-3 border-t border-rule">
            <PenCheck task={s} size={22} onToggle={() => update.mutate({ id: s.id, patch: { status: s.status === 'done' ? 'todo' : 'done' } })} />
            <input
              defaultValue={s.title}
              aria-label="Tên subtask"
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== s.title) update.mutate({ id: s.id, patch: { title: v } })
              }}
              className={cn('min-w-0 flex-1 bg-transparent py-2 text-base font-medium outline-none', s.status === 'done' && 'text-cap line-through')}
            />
            <button className="-mr-2 p-2 text-cap" aria-label="Xóa subtask" onClick={() => del.mutate(s.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
        <form onSubmit={add} className="flex min-h-11 items-center gap-3 border-t border-rule text-cap">
          <Plus size={22} className="shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Thêm subtask"
            aria-label="Thêm subtask"
            className="flex-1 bg-transparent py-2 text-base outline-none placeholder:text-cap"
          />
        </form>
      </div>
    </div>
  )
}
