import { addDays, format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAreas, useCreateTag, useCreateTask, useDeleteTask, useProjects, useSetTaskTags, useTags } from '../lib/api'
import { fromInputs, today } from '../lib/dates'
import { cn, newId } from '../lib/tasks'
import { useAddSheet } from '../lib/useSheets'
import { Chip } from './ui/Chip'
import { Sheet } from './ui/Sheet'

type DueChoice = 'today' | 'tomorrow' | 'week' | 'custom' | null

const PRIORITY_CHIP = [
  { label: 'Ưu tiên', cls: '' },
  { label: 'Thấp', cls: 'border-prio-low text-prio-low' },
  { label: 'Trung bình', cls: 'border-prio-mid text-prio-mid' },
  { label: 'Cao', cls: 'border-prio-high text-prio-high' },
]

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

function dueDate(choice: DueChoice, custom: string): string {
  const now = new Date()
  if (choice === 'today') return ymd(now)
  if (choice === 'tomorrow') return ymd(addDays(now, 1))
  if (choice === 'week') return ymd(addDays(now, 7))
  if (choice === 'custom') return custom
  return ''
}

/**
 * Lấy mặc định theo trang đang xem: Hôm nay → hạn hôm nay; Sắp tới → ngày đang chọn trên lịch;
 * khu vực / project → gắn sẵn vào đó.
 */
function useContextDefaults() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const { data: projects } = useProjects()
  const parts = pathname.split('/').filter(Boolean)
  let area: string | null = null
  let project: string | null = null
  if (parts[0] === 'area') area = parts[1] ?? null
  if (parts[0] === 'project') {
    project = parts[1] ?? null
    area = projects?.find((p) => p.id === project)?.area_id ?? null
  }
  let due: DueChoice = parts[0] === 'today' || parts.length === 0 ? 'today' : null
  let custom = ''
  if (parts[0] === 'upcoming') {
    const now = today()
    const day = params.get('day') ?? ymd(now)
    if (day === ymd(now)) due = 'today'
    else if (day === ymd(addDays(now, 1))) due = 'tomorrow'
    else {
      due = 'custom'
      custom = day
    }
  }
  return { area, project, due, custom }
}

export function AddSheet() {
  const add = useAddSheet()
  return (
    <Sheet open={add.isOpen} onOpenChange={(o) => !o && add.close()} title="Thêm việc">
      {add.isOpen && <AddBody />}
    </Sheet>
  )
}

function AddBody() {
  const defaults = useContextDefaults()
  const { data: areas } = useAreas()
  const { data: projects } = useProjects()
  const { data: tags } = useTags()
  const create = useCreateTask()
  const del = useDeleteTask()
  const createTag = useCreateTag()
  const setTags = useSetTaskTags()

  const [title, setTitle] = useState('')
  const [due, setDue] = useState<DueChoice>(defaults.due)
  const [custom, setCustom] = useState(defaults.custom)
  const [areaId, setAreaId] = useState<string | null>(defaults.area)
  const [projectId, setProjectId] = useState<string | null>(defaults.project)
  const [priority, setPriority] = useState(0)
  const [more, setMore] = useState(false)
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    let text = title.trim()
    if (!text) return
    // Phím tắt: !1 !2 !3 = ưu tiên, #tag = gắn tag (vẫn dùng được, nhưng không bắt buộc phải nhớ)
    let prio = priority
    text = text.replace(/(^|\s)!([1-3])(?=\s|$)/g, (_m, sp, p) => {
      prio = Number(p)
      return sp
    })
    const tagNames: string[] = []
    text = text.replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_m, sp, name) => {
      tagNames.push(name)
      return sp
    })
    text = text.replace(/\s+/g, ' ').trim()
    if (!text) return

    const date = dueDate(due, custom) || (time ? ymd(new Date()) : '')
    const id = newId()
    const created = create
      .mutateAsync({
        id,
        title: text,
        priority: prio,
        area_id: areaId,
        project_id: projectId,
        notes: notes.trim() || null,
        ...fromInputs(date, time),
      })
      .then(() => true)
      .catch(() => {
        toast.error('Không lưu được việc, thử lại nhé')
        return false
      })

    // Việc hiện ngay (optimistic); sẵn sàng thêm việc tiếp theo
    setTitle('')
    setNotes('')
    setTime('')
    setPriority(0)
    inputRef.current?.focus()
    toast(`Đã thêm “${text}”`, { action: { label: 'Hoàn tác', onClick: () => del.mutate(id) } })

    if (tagNames.length) {
      const ids: string[] = []
      for (const name of tagNames) {
        const existing = tags?.find((t) => t.name.toLowerCase() === name.toLowerCase())
        ids.push(existing ? existing.id : (await createTag.mutateAsync({ name })).id)
      }
      if (await created) setTags.mutate({ taskId: id, tagIds: ids })
    }
  }

  const customLabel = custom ? format(new Date(custom + 'T00:00'), 'dd/MM') : 'Chọn…'

  return (
    <form onSubmit={submit}>
      <input
        ref={inputRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Việc cần làm?"
        enterKeyHint="done"
        aria-label="Việc cần làm"
        className="w-full rounded-[10px] border-[1.5px] border-brand bg-canvas px-3.5 py-3 text-base font-medium outline-none placeholder:font-normal placeholder:text-cap"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ['today', 'Hôm nay'],
            ['tomorrow', 'Ngày mai'],
            ['week', 'Tuần sau'],
          ] as const
        ).map(([k, label]) => (
          <Chip key={k} selected={due === k} onClick={() => setDue(due === k ? null : k)}>
            {label}
          </Chip>
        ))}
        <label className={cn('chip relative cursor-pointer', due === 'custom' && 'border-brand bg-brand font-semibold text-on-brand')}>
          📅 {customLabel}
          <input
            type="date"
            aria-label="Chọn ngày"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              setDue(e.target.value ? 'custom' : null)
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {areas?.map((a) => (
          <Chip
            key={a.id}
            selected={areaId === a.id}
            onClick={() => {
              setAreaId(areaId === a.id ? null : a.id)
              setProjectId(null)
            }}
          >
            {a.icon} {a.name}
          </Chip>
        ))}
        <button
          type="button"
          onClick={() => setPriority((priority + 1) % 4)}
          className={cn('chip', PRIORITY_CHIP[priority].cls)}
          aria-label={`Mức ưu tiên: ${PRIORITY_CHIP[priority].label}`}
        >
          ⚑ {PRIORITY_CHIP[priority].label}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMore(!more)}
        aria-expanded={more}
        className="mt-3.5 flex min-h-11 items-center gap-1 text-sm font-medium text-cap"
      >
        <ChevronRight size={14} className={cn('transition-transform', more && 'rotate-90')} /> Thêm chi tiết
        {!more && <span className="font-normal"> · giờ, project, ghi chú</span>}
      </button>

      {more && (
        <div className="mb-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <label className="label w-12 shrink-0">Giờ</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="label w-12 shrink-0">Project</label>
            <select className="input" value={projectId ?? ''} onChange={(e) => setProjectId(e.target.value || null)}>
              <option value="">— Không —</option>
              {projects
                ?.filter((p) => !p.archived && (!areaId || p.area_id === areaId))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <textarea className="input min-h-20" placeholder="Ghi chú, link…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}

      <button type="submit" className="btn-primary mt-3 h-12 w-full text-base" disabled={!title.trim()}>
        Thêm việc
      </button>
    </form>
  )
}
