import { Plus } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAreas, useProjects } from '../lib/api'
import { NAV_ITEMS } from '../lib/nav'
import { cn } from '../lib/tasks'
import { useAddSheet } from '../lib/useSheets'
import { AddSheet } from './AddSheet'
import { BottomNav } from './BottomNav'
import { TaskSheetHost } from './TaskSheet'

/** Cột trái cho máy tính: cùng 4 mục như thanh dưới + lối tắt tới khu vực / project. */
function Rail() {
  const add = useAddSheet()
  const { data: areas } = useAreas()
  const { data: projects } = useProjects()
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-10 items-center gap-2.5 rounded-[10px] px-3 text-sm font-medium text-body',
      isActive && 'bg-alt font-semibold text-teal',
    )
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-rule p-4 md:flex">
      <div className="flex items-center gap-2 px-1 pb-3">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="size-7" />
        <span className="font-serif text-xl">DyNAMic</span>
      </div>
      <button onClick={add.open} className="btn-primary mb-2 w-full">
        <Plus size={16} /> Thêm việc
      </button>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={link}>
          <Icon size={18} strokeWidth={1.9} /> {label}
        </NavLink>
      ))}
      {areas?.map((a) => (
        <div key={a.id} className="mt-4">
          <NavLink to={`/area/${a.id}`} className="label block px-3 pb-1">
            {a.icon} {a.name}
          </NavLink>
          {projects
            ?.filter((p) => p.area_id === a.id && !p.archived)
            .map((p) => (
              <NavLink key={p.id} to={`/project/${p.id}`} className={link}>
                <span className="pcolor size-2 rounded-full" style={{ '--c': p.color } as React.CSSProperties} />
                <span className="truncate">{p.name}</span>
              </NavLink>
            ))}
        </div>
      ))}
    </aside>
  )
}

export function Layout() {
  return (
    <div className="flex h-full">
      <Rail />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl pb-32 md:pt-4 md:pb-12">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <AddSheet />
      <TaskSheetHost />
    </div>
  )
}
