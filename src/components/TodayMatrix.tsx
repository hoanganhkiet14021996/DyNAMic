import { motion } from 'motion/react'
import { useRef } from 'react'
import { useAreas, useProjects, useUpdateTask } from '../lib/api'
import { useTaskActions } from '../lib/actions'
import { dueLabel, formatClock, isOverdue } from '../lib/dates'
import { cn, isHeavy } from '../lib/tasks'
import type { Task } from '../lib/types'
import { useOpenTask } from '../lib/useOpenTask'
import { PenCheck } from './PenCheck'

interface Quad {
  key: string
  urgent: boolean
  heavy: boolean
  title: string
  hint: string
  bg: string
}

// Ngang: trái = chưa gấp, phải = gấp. Dọc: trên = tốn công, dưới = nhẹ.
const QUADS: Quad[] = [
  { key: 'plan', urgent: false, heavy: true, title: 'Lên kế hoạch', hint: 'nặng, chưa gấp · chia nhỏ ra', bg: 'bg-q-plan' },
  { key: 'now', urgent: true, heavy: true, title: 'Bắt tay ngay', hint: 'nặng + gấp', bg: 'bg-q-now' },
  { key: 'free', urgent: false, heavy: false, title: 'Lúc rảnh', hint: 'nhẹ, chưa gấp', bg: 'bg-q-free' },
  { key: 'quick', urgent: true, heavy: false, title: 'Làm luôn', hint: 'nhẹ + gấp', bg: 'bg-q-quick' },
]

const axis = 'text-xs font-semibold tracking-[0.06em] text-cap uppercase'

/** Ma trận Gấp × Tốn công cho việc hôm nay. Kéo việc sang ô khác = đổi cờ Gấp / Tốn công. */
export function TodayMatrix({
  tasks,
  childrenOf,
  focusId,
}: {
  tasks: Task[]
  childrenOf: Map<string, Task[]>
  focusId?: string
}) {
  const update = useUpdateTask()
  const place = (t: Task) => ({ urgent: t.is_urgent, heavy: isHeavy(t, childrenOf.get(t.id) ?? []) })

  const drop = (t: Task, key: string) => {
    const q = QUADS.find((x) => x.key === key)
    const now = place(t)
    if (!q || (q.urgent === now.urgent && q.heavy === now.heavy)) return
    update.mutate({ id: t.id, patch: { is_urgent: q.urgent, is_heavy: q.heavy } })
  }

  return (
    <div className="grid grid-cols-[18px_1fr_1fr] gap-2 px-3 pt-1 pb-2">
      <span />
      <span className={cn(axis, 'text-center')}>Chưa gấp</span>
      <span className={cn(axis, 'text-center')}>Gấp →</span>
      {QUADS.map((q, i) => (
        <QuadBox
          key={q.key}
          quad={q}
          label={i === 0 ? 'Tốn công' : i === 2 ? 'Nhẹ' : undefined}
          tasks={tasks.filter((t) => {
            const p = place(t)
            return p.urgent === q.urgent && p.heavy === q.heavy
          })}
          focusId={focusId}
          onDrop={drop}
        />
      ))}
    </div>
  )
}

function QuadBox({
  quad,
  label,
  tasks,
  focusId,
  onDrop,
}: {
  quad: Quad
  label?: string
  tasks: Task[]
  focusId?: string
  onDrop: (t: Task, key: string) => void
}) {
  return (
    <>
      {label && (
        <span className={cn(axis, 'flex rotate-180 items-center justify-center [writing-mode:vertical-rl]')}>{label}</span>
      )}
      <section data-quad={quad.key} className={cn('min-h-44 rounded-[12px] border border-rule2 px-2.5 pt-2 pb-1', quad.bg)}>
        <h3 className="font-serif text-base leading-tight">{quad.title}</h3>
        <p className="mb-1 text-xs text-cap">{quad.hint}</p>
        {tasks.map((t) => (
          <MatrixItem key={t.id} task={t} focus={t.id === focusId} onDrop={onDrop} />
        ))}
        {!tasks.length && <p className="py-2 text-xs text-cap">Kéo việc vào đây</p>}
      </section>
    </>
  )
}

function MatrixItem({ task, focus, onDrop }: { task: Task; focus: boolean; onDrop: (t: Task, key: string) => void }) {
  const open = useOpenTask()
  const actions = useTaskActions()
  const { data: projects } = useProjects()
  const { data: areas } = useAreas()
  const node = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const area = areas?.find((a) => a.id === (task.area_id ?? projects?.find((p) => p.id === task.project_id)?.area_id))
  const late = isOverdue(task)
  const when = late ? dueLabel(task) : !task.all_day && task.due_at ? formatClock(task.due_at) : null

  return (
    <motion.div
      ref={node}
      drag
      dragSnapToOrigin
      dragMomentum={false}
      whileDrag={{ scale: 1.05, zIndex: 20, boxShadow: '0 8px 24px rgb(0 0 0 / 0.2)' }}
      onDragStart={() => {
        dragged.current = true
      }}
      onDragEnd={(e) => {
        // tìm ô đang nằm dưới ngón tay (bỏ qua chính việc đang kéo)
        const pt = 'changedTouches' in e ? e.changedTouches[0] : e
        const target = document
          .elementsFromPoint(pt.clientX, pt.clientY)
          .find((el) => !node.current?.contains(el))
          ?.closest<HTMLElement>('[data-quad]')
        if (target?.dataset.quad) onDrop(task, target.dataset.quad)
        setTimeout(() => {
          dragged.current = false
        }, 0)
      }}
      onClick={() => {
        if (!dragged.current) open(task.id)
      }}
      className={cn(
        'relative flex cursor-grab items-start gap-2 rounded-md border-t border-rule2/70 bg-transparent py-1.5 select-none active:cursor-grabbing',
        focus && 'font-semibold',
      )}
    >
      <PenCheck task={task} size={16} onToggle={() => actions.complete(task)} />
      <div className="min-w-0 flex-1 text-sm leading-snug font-medium break-words">
        {focus && <span className="text-teal">★ </span>}
        {task.title}
        <div className="text-xs font-medium text-cap">
          {when && <span className={cn(late && 'font-semibold text-oxblood')}>{when}</span>}
          {when && area && ' · '}
          {area?.icon}
        </div>
      </div>
    </motion.div>
  )
}
