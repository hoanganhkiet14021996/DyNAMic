export type TaskStatus = 'todo' | 'doing' | 'done'

export interface Area {
  id: string
  name: string
  color: string
  icon: string | null
  sort_order: number
}

export interface Project {
  id: string
  area_id: string | null
  name: string
  color: string
  deadline: string | null
  archived: boolean
  sort_order: number
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  area_id: string | null
  project_id: string | null
  parent_id: string | null
  title: string
  notes: string | null
  status: TaskStatus
  priority: number
  is_urgent: boolean
  is_important: boolean
  due_at: string | null
  start_at: string | null
  all_day: boolean
  rrule: string | null
  progress: number
  sort_order: number
  kanban_order: number
  completed_at: string | null
  created_at: string
  updated_at: string
  task_tags: { tag_id: string }[]
}

export type TaskInput = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'task_tags'>> & {
  title?: string
}

export const PRIORITIES = [
  { value: 0, label: 'Không' },
  { value: 1, label: 'Thấp' },
  { value: 2, label: 'Trung bình' },
  { value: 3, label: 'Cao' },
] as const

export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Cần làm' },
  { value: 'doing', label: 'Đang làm' },
  { value: 'done', label: 'Xong' },
]
