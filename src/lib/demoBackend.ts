// Chế độ demo (`npm run demo`): giả lập Supabase REST trong bộ nhớ để xem giao diện mà không cần bảng thật.
// Dữ liệu mất khi tải lại trang. File này chỉ được nạp khi VITE_DEMO=1 (không vào bản build thật).

import { demoUser } from './demoSession'

type Row = Record<string, unknown> & { id?: string }

const iso = (d: Date) => d.toISOString()
const now = new Date()
const at = (days: number, h = 0, m = 0) => iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, h, m))

const db: Record<string, Row[]> = {
  areas: [
    { id: 'a1', name: 'Công việc', color: '#6366f1', icon: '💼', sort_order: 0 },
    { id: 'a2', name: 'Cá nhân', color: '#f59e0b', icon: '🏠', sort_order: 1 },
  ],
  projects: [
    { id: 'p1', area_id: 'a1', name: 'Báo cáo Q4', color: '#1e4f8f', deadline: null, archived: false, sort_order: 0 },
    { id: 'p2', area_id: 'a2', name: 'Du lịch Đà Lạt', color: '#22c55e', deadline: null, archived: false, sort_order: 0 },
  ],
  tags: [
    { id: 'g1', name: 'sếp', color: '#64748b' },
    { id: 'g2', name: 'gấp', color: '#ef4444' },
  ],
  tasks: [],
  task_tags: [{ task_id: 'r1', tag_id: 'g1' }, { task_id: 'r1', tag_id: 'g2' }],
  settings: [],
}

let n = 0
function addTask(o: Row) {
  n++
  db.tasks.push({
    id: `t${n}`, area_id: null, project_id: null, parent_id: null, notes: null, status: 'todo', priority: 0,
    is_urgent: false, is_important: false, due_at: null, start_at: null, all_day: false, rrule: null,
    progress: 0, sort_order: n, kanban_order: n, completed_at: null, created_at: iso(now), updated_at: iso(now), ...o,
  })
}
addTask({ id: 'r1', title: 'Gửi báo cáo doanh thu tháng 9', area_id: 'a1', project_id: 'p1', priority: 3, due_at: at(-1, 17), is_urgent: true, is_important: true, notes: 'Gửi cho anh Minh' })
addTask({ title: 'Họp team sprint planning', area_id: 'a1', priority: 2, due_at: at(0, 9, 30), status: 'doing' })
addTask({ id: 'r3', title: 'Hoàn thiện slide trình bày', area_id: 'a1', project_id: 'p1', priority: 2, due_at: at(0, 15) })
addTask({ title: 'Thu thập số liệu', parent_id: 'r3', area_id: 'a1', status: 'done' })
addTask({ title: 'Vẽ biểu đồ', parent_id: 'r3', area_id: 'a1' })
addTask({ title: 'Viết kết luận', parent_id: 'r3', area_id: 'a1' })
addTask({ title: 'Mua quà sinh nhật mẹ', area_id: 'a2', priority: 1, due_at: at(0), all_day: true })
addTask({ title: 'Đặt vé máy bay', area_id: 'a2', project_id: 'p2', priority: 2, due_at: at(2, 20) })
addTask({ title: 'Đặt phòng khách sạn', area_id: 'a2', project_id: 'p2', due_at: at(3), all_day: true, progress: 40 })
addTask({ title: 'Ý tưởng: học tiếng Nhật' })
addTask({ title: 'Review code PR #42', area_id: 'a1', status: 'done', completed_at: at(0, 8) })

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

export async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const req = new Request(input, init)
  const url = new URL(req.url)
  if (url.pathname.startsWith('/auth/v1/user')) return json(demoUser)
  const m = url.pathname.match(/\/rest\/v1\/dyn_(\w+)/)
  if (!m || !db[m[1]]) return json({}, 404)
  const table = m[1]
  const eq = (col: string) => url.searchParams.get(col)?.replace('eq.', '')
  const single = req.headers.get('accept')?.includes('vnd.pgrst.object')

  if (req.method === 'GET' || req.method === 'HEAD') {
    const rows = table === 'tasks'
      ? db.tasks.map((t) => ({ ...t, task_tags: db.task_tags.filter((x) => x.task_id === t.id).map((x) => ({ tag_id: x.tag_id })) }))
      : db[table]
    if (req.method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-range': `*/${rows.length}` } })
    return json(rows)
  }
  if (req.method === 'POST') {
    const body = (await req.json()) as Row | Row[]
    const rows = Array.isArray(body) ? body : [body]
    if (table === 'settings') return json([], 201)
    const created = rows.map((r) => {
      const defaults = table === 'tasks' ? { created_at: iso(new Date()), updated_at: iso(new Date()), completed_at: null } : {}
      const row = { id: `x${++n}`, color: '#64748b', ...defaults, ...r }
      db[table].push(row)
      return row
    })
    return json(single ? created[0] : created, 201)
  }
  if (req.method === 'PATCH') {
    const patch = (await req.json()) as Row
    const row = db[table].find((r) => r.id === eq('id'))
    if (row) {
      Object.assign(row, patch)
      if (table === 'tasks' && patch.status) row.completed_at = patch.status === 'done' ? iso(new Date()) : null
    }
    return json(null, 204)
  }
  if (req.method === 'DELETE') {
    if (table === 'task_tags') db.task_tags = db.task_tags.filter((x) => x.task_id !== eq('task_id'))
    else db[table] = db[table].filter((r) => r.id !== eq('id'))
    return json(null, 204)
  }
  return json(null, 204)
}
