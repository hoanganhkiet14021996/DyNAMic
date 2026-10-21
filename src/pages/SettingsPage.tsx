import { LogOut, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { ConfirmButton } from '../components/ConfirmButton'
import { PageHeader } from '../components/PageHeader'
import { Chip } from '../components/ui/Chip'
import {
  useAreas,
  useCreateArea,
  useDeleteArea,
  useDeleteTag,
  useProjects,
  useTags,
  useUpdateArea,
  useUpdateProject,
} from '../lib/api'
import { displayName, signOut } from '../lib/auth'
import { newId } from '../lib/tasks'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-5 mb-4 rounded-[10px] border border-rule p-4">
      <h2 className="mb-3 font-serif text-base font-normal">{title}</h2>
      {children}
    </section>
  )
}

type Theme = 'light' | 'dark' | 'system'

function readTheme(): Theme {
  try {
    return (localStorage.getItem('theme') as Theme | null) ?? 'system'
  } catch {
    return 'system'
  }
}

/** Đổi theme ngay + nhớ lựa chọn; cập nhật cả màu thanh trạng thái của trình duyệt / iPhone. */
function applyTheme(t: Theme) {
  try {
    if (t === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', t)
  } catch {
    /* bộ nhớ trình duyệt bị chặn — vẫn đổi giao diện cho phiên này */
  }
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f4a4d' : '#fbf6e9')
}

export function SettingsPage() {
  const { session } = useAuth()
  const [theme, setTheme] = useState<Theme>(readTheme)

  return (
    <>
      <PageHeader label="Tuỳ chỉnh" title="Cài đặt" />

      <Card title="Giao diện">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['light', 'Sáng'],
              ['dark', 'Tối'],
              ['system', 'Theo máy'],
            ] as const
          ).map(([v, label]) => (
            <Chip
              key={v}
              selected={theme === v}
              onClick={() => {
                setTheme(v)
                applyTheme(v)
              }}
            >
              {label}
            </Chip>
          ))}
        </div>
      </Card>

      <AreasCard />
      <TagsCard />
      <ArchivedProjectsCard />

      <Card title="Tài khoản">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 text-sm text-body">
            Đăng nhập: <b className="font-semibold text-ink">{displayName(session?.user)}</b>
            <span className="block text-xs text-cap">Dùng chung với NAMONEY / NomNam</span>
          </span>
          <button className="btn-outline shrink-0" onClick={() => signOut()}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </Card>
    </>
  )
}

function AreasCard() {
  const { data: areas } = useAreas()
  const create = useCreateArea()
  const update = useUpdateArea()
  const del = useDeleteArea()
  const [newName, setNewName] = useState('')

  function add(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    create.mutate({ id: newId(), name, icon: '📁', sort_order: (areas?.length ?? 0) + 1 })
    setNewName('')
  }

  return (
    <Card title="Khu vực">
      <div className="space-y-2">
        {areas?.map((a) => (
          <div key={a.id} className="flex items-center gap-2">
            <input
              defaultValue={a.icon ?? ''}
              onBlur={(e) => e.target.value !== (a.icon ?? '') && update.mutate({ id: a.id, icon: e.target.value || null })}
              className="input w-14 text-center"
              aria-label="Icon"
            />
            <input
              defaultValue={a.name}
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== a.name) update.mutate({ id: a.id, name: v })
              }}
              className="input"
              aria-label="Tên khu vực"
            />
            <ConfirmButton
              className="btn-danger shrink-0 px-3 text-xs"
              ariaLabel="Xóa khu vực (việc bên trong chuyển về Inbox)"
              confirmLabel="Xóa?"
              onConfirm={() => del.mutate(a.id)}
            >
              <Trash2 size={16} />
            </ConfirmButton>
          </div>
        ))}
        <form onSubmit={add}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="+ Thêm khu vực (vd: Học tập)"
            aria-label="Khu vực mới"
            className="input"
            enterKeyHint="done"
          />
        </form>
      </div>
    </Card>
  )
}

function TagsCard() {
  const { data: tags } = useTags()
  const del = useDeleteTag()
  if (!tags?.length) return null
  return (
    <Card title="Tag">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t.id} className="chip gap-1 pr-1.5">
            #{t.name}
            <ConfirmButton
              className="min-h-8 rounded-full px-2 text-cap"
              ariaLabel={`Xóa tag ${t.name}`}
              confirmLabel="xóa?"
              onConfirm={() => del.mutate(t.id)}
            >
              ×
            </ConfirmButton>
          </span>
        ))}
      </div>
    </Card>
  )
}

function ArchivedProjectsCard() {
  const { data: projects } = useProjects()
  const update = useUpdateProject()
  const archived = projects?.filter((p) => p.archived) ?? []
  if (!archived.length) return null
  return (
    <Card title="Project đã lưu trữ">
      <div>
        {archived.map((p) => (
          <div key={p.id} className="flex min-h-11 items-center justify-between border-t border-rule first:border-t-0 text-sm">
            <span>{p.name}</span>
            <button className="btn-ghost min-h-9 text-xs" onClick={() => update.mutate({ id: p.id, archived: false })}>
              Khôi phục
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
