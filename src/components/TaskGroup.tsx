import { ChevronRight, GripVertical } from 'lucide-react'
import { Reorder, useDragControls, type DragControls } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useReorderTasks } from '../lib/api'
import { cn, reorderPatch } from '../lib/tasks'
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

/**
 * Như TaskRows nhưng kéo tay nắm ⋮⋮ ở cuối dòng để đổi thứ tự (lưu vào sort_order).
 * Danh sách truyền vào phải đã xếp theo compareManual. `showDue` có thể tính riêng cho từng việc.
 */
export function SortableTaskRows({
  tasks,
  childrenOf,
  showDue,
  dense,
  highlightId,
}: {
  tasks: Task[]
  childrenOf: Map<string, Task[]>
  showDue?: boolean | ((t: Task) => boolean)
  dense?: boolean
  highlightId?: string
}) {
  const reorder = useReorderTasks()
  const baseKey = tasks.map((t) => t.id).join()
  // Thứ tự tạm trong lúc kéo; tự bỏ khi danh sách thật đã đổi (sau khi lưu)
  const [draft, setDraft] = useState<{ base: string; ids: string[] } | null>(null)
  const ids = draft?.base === baseKey ? draft.ids : tasks.map((t) => t.id)
  const latest = useRef<string[] | null>(null)
  const byId = new Map(tasks.map((t) => [t.id, t]))

  const commit = () => {
    if (!latest.current) return
    const after = latest.current.map((id) => byId.get(id)!).filter(Boolean)
    latest.current = null
    const patch = reorderPatch(tasks, after)
    if (patch.length) reorder.mutate(patch)
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={ids}
      onReorder={(next) => {
        latest.current = next
        setDraft({ base: baseKey, ids: next })
      }}
    >
      {ids.map((id) => {
        const t = byId.get(id)
        if (!t) return null
        return (
          <SortableItem key={id} id={id} onDrop={commit}>
            {(controls) => (
              <TaskRow
                task={t}
                subtasks={childrenOf.get(t.id) ?? []}
                showDue={typeof showDue === 'function' ? showDue(t) : showDue}
                dense={dense}
                highlight={t.id === highlightId}
                handle={<DragHandle controls={controls} />}
              />
            )}
          </SortableItem>
        )
      })}
    </Reorder.Group>
  )
}

function SortableItem({ id, onDrop, children }: { id: string; onDrop: () => void; children: (c: DragControls) => ReactNode }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      as="div"
      value={id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      className="relative bg-canvas"
      whileDrag={{ zIndex: 10, boxShadow: '0 8px 24px rgb(0 0 0 / 0.18)', scale: 1.02 }}
    >
      {children(controls)}
    </Reorder.Item>
  )
}

/**
 * Tay nắm kéo thả. Gắn pointerdown kiểu native + chặn lan lên dòng, để không kích hoạt vuốt ngang (SwipeRow)
 * — thư viện motion nghe pointerdown native nên stopPropagation của React không chặn được.
 */
function DragHandle({ controls }: { controls: DragControls }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const down = (e: PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      controls.start(e)
    }
    el.addEventListener('pointerdown', down)
    return () => el.removeEventListener('pointerdown', down)
  }, [controls])
  return (
    <span
      ref={ref}
      role="button"
      aria-label="Kéo để đổi thứ tự"
      className="-my-2 flex w-11 shrink-0 cursor-grab touch-none items-center justify-center self-stretch text-cap opacity-60 select-none active:cursor-grabbing"
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical size={16} />
    </span>
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
