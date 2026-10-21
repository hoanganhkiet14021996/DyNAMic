import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { subDays } from 'date-fns'
import { supabase } from './supabase'
import type { Area, Project, Tag, Task, TaskInput } from './types'

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

const keys = {
  areas: ['areas'] as QueryKey,
  projects: ['projects'] as QueryKey,
  tags: ['tags'] as QueryKey,
  tasks: ['tasks'] as QueryKey,
}

// ---------- Lần đăng nhập đầu ----------

const bootstrapped = new Map<string, Promise<void>>()

/**
 * Tạo cài đặt + 2 khu vực mặc định nếu tài khoản chưa có (làm ở client thay vì trigger trên auth.users,
 * vì project Supabase dùng chung — trigger lỗi sẽ chặn đăng ký ở mọi app). Chỉ chạy 1 lần mỗi user/phiên.
 */
export function ensureDefaults(userId: string) {
  let p = bootstrapped.get(userId)
  if (!p) {
    p = (async () => {
      const { error } = await supabase
        .from('dyn_settings')
        .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
      if (error) throw new Error(error.message)
      const { count } = await supabase.from('dyn_areas').select('id', { count: 'exact', head: true })
      if (count === 0)
        must(
          await supabase.from('dyn_areas').insert([
            { name: 'Công việc', color: '#6366f1', icon: '💼', sort_order: 0 },
            { name: 'Cá nhân', color: '#f59e0b', icon: '🏠', sort_order: 1 },
          ]),
        )
    })()
    p.catch(() => bootstrapped.delete(userId)) // lỗi (mất mạng, chưa chạy schema) → lần sau thử lại
    bootstrapped.set(userId, p)
  }
  return p
}

// ---------- Queries ----------

export function useAreas() {
  return useQuery({
    queryKey: keys.areas,
    queryFn: async () => must(await supabase.from('dyn_areas').select('*').order('sort_order')) as Area[],
  })
}

export function useProjects() {
  return useQuery({
    queryKey: keys.projects,
    queryFn: async () =>
      must(await supabase.from('dyn_projects').select('*').order('sort_order').order('created_at')) as Project[],
  })
}

export function useTags() {
  return useQuery({
    queryKey: keys.tags,
    queryFn: async () => must(await supabase.from('dyn_tags').select('*').order('name')) as Tag[],
  })
}

/**
 * Tải toàn bộ việc đang mở + việc xong trong 90 ngày + mọi subtask (để tính tiến độ đúng).
 * Dùng 1 mình nên lượng dữ liệu nhỏ — lọc phía client cho nhanh.
 */
export function useTasks() {
  return useQuery({
    queryKey: keys.tasks,
    queryFn: async () => {
      const since = subDays(new Date(), 90).toISOString()
      return must(
        await supabase
          .from('dyn_tasks')
          .select('*, task_tags:dyn_task_tags(tag_id)')
          .or(`status.neq.done,completed_at.gte.${since},parent_id.not.is.null`)
          .order('sort_order')
          .order('created_at'),
      ) as Task[]
    },
  })
}

// ---------- Task mutations (optimistic) ----------

function useOptimisticTasks() {
  const qc = useQueryClient()
  return {
    qc,
    async apply(fn: (tasks: Task[]) => Task[]) {
      await qc.cancelQueries({ queryKey: keys.tasks })
      const prev = qc.getQueryData<Task[]>(keys.tasks)
      qc.setQueryData<Task[]>(keys.tasks, (old) => fn(old ?? []))
      return { prev }
    },
    rollback(ctx?: { prev?: Task[] }) {
      if (ctx?.prev) qc.setQueryData(keys.tasks, ctx.prev)
    },
    settle: () => qc.invalidateQueries({ queryKey: keys.tasks }),
  }
}

export function useCreateTask() {
  const o = useOptimisticTasks()
  return useMutation({
    mutationFn: async (input: TaskInput & { id: string; title: string }) => {
      must(await supabase.from('dyn_tasks').insert(input))
    },
    onMutate: (input) => {
      const now = new Date().toISOString()
      const task: Task = {
        area_id: null,
        project_id: null,
        parent_id: null,
        notes: null,
        status: 'todo',
        priority: 0,
        is_urgent: false,
        is_important: false,
        due_at: null,
        start_at: null,
        all_day: false,
        rrule: null,
        progress: 0,
        sort_order: Date.now(),
        kanban_order: Date.now(),
        completed_at: null,
        created_at: now,
        updated_at: now,
        task_tags: [],
        ...input,
      }
      return o.apply((tasks) => [...tasks, task])
    },
    onError: (_e, _v, ctx) => o.rollback(ctx),
    onSettled: o.settle,
  })
}

export function useUpdateTask() {
  const o = useOptimisticTasks()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TaskInput }) => {
      must(await supabase.from('dyn_tasks').update(patch).eq('id', id))
    },
    onMutate: ({ id, patch }) =>
      o.apply((tasks) =>
        tasks.map((t) => {
          if (t.id !== id) return t
          const next = { ...t, ...patch }
          if (patch.status) next.completed_at = patch.status === 'done' ? new Date().toISOString() : null
          return next
        }),
      ),
    onError: (_e, _v, ctx) => o.rollback(ctx),
    onSettled: o.settle,
  })
}

export function useDeleteTask() {
  const o = useOptimisticTasks()
  return useMutation({
    mutationFn: async (id: string) => {
      must(await supabase.from('dyn_tasks').delete().eq('id', id))
    },
    onMutate: (id) => o.apply((tasks) => tasks.filter((t) => t.id !== id && t.parent_id !== id)),
    onError: (_e, _v, ctx) => o.rollback(ctx),
    onSettled: o.settle,
  })
}

export function useSetTaskTags() {
  const o = useOptimisticTasks()
  return useMutation({
    mutationFn: async ({ taskId, tagIds }: { taskId: string; tagIds: string[] }) => {
      must(await supabase.from('dyn_task_tags').delete().eq('task_id', taskId))
      if (tagIds.length)
        must(await supabase.from('dyn_task_tags').insert(tagIds.map((tag_id) => ({ task_id: taskId, tag_id }))))
    },
    onMutate: ({ taskId, tagIds }) =>
      o.apply((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, task_tags: tagIds.map((tag_id) => ({ tag_id })) } : t)),
      ),
    onError: (_e, _v, ctx) => o.rollback(ctx),
    onSettled: o.settle,
  })
}

// ---------- Areas / Projects / Tags ----------

function useSimpleMutation<V>(key: QueryKey, fn: (v: V) => PromiseLike<{ error: { message: string } | null }>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: V) => {
      const { error } = await fn(v)
      if (error) throw new Error(error.message)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      // Xóa project/area làm thay đổi task (set null) nên tải lại cả tasks
      qc.invalidateQueries({ queryKey: keys.tasks })
    },
  })
}

export const useCreateProject = () =>
  useSimpleMutation(keys.projects, (p: Partial<Project> & { name: string }) => supabase.from('dyn_projects').insert(p))
export const useUpdateProject = () =>
  useSimpleMutation(keys.projects, ({ id, ...patch }: Partial<Project> & { id: string }) =>
    supabase.from('dyn_projects').update(patch).eq('id', id),
  )
export const useDeleteProject = () =>
  useSimpleMutation(keys.projects, (id: string) => supabase.from('dyn_projects').delete().eq('id', id))

export const useCreateArea = () =>
  useSimpleMutation(keys.areas, (a: Partial<Area> & { name: string }) => supabase.from('dyn_areas').insert(a))
export const useUpdateArea = () =>
  useSimpleMutation(keys.areas, ({ id, ...patch }: Partial<Area> & { id: string }) =>
    supabase.from('dyn_areas').update(patch).eq('id', id),
  )
export const useDeleteArea = () =>
  useSimpleMutation(keys.areas, (id: string) => supabase.from('dyn_areas').delete().eq('id', id))

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (t: { name: string; color?: string }) =>
      must(await supabase.from('dyn_tags').insert(t).select().single()) as Tag,
    onSettled: () => qc.invalidateQueries({ queryKey: keys.tags }),
  })
}
export const useDeleteTag = () =>
  useSimpleMutation(keys.tags, (id: string) => supabase.from('dyn_tags').delete().eq('id', id))

// ---------- Hoàn tác xóa ----------

/** Chèn lại các việc (cha + subtask + tag) đã xóa. Dùng cho nút "Hoàn tác" sau khi xóa. */
export function useRestoreTasks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: Task[]) => {
      const rows = items.map((t) => {
        const row: Record<string, unknown> = { ...t }
        delete row.task_tags
        return row
      })
      must(await supabase.from('dyn_tasks').insert(rows))
      const links = items.flatMap((t) => t.task_tags.map((x) => ({ task_id: t.id, tag_id: x.tag_id })))
      if (links.length) must(await supabase.from('dyn_task_tags').insert(links))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.tasks }),
  })
}
