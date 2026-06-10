export type Page = {
  id: string
  workspace_id: string
  parent_id: string | null
  title: string
  content: unknown[] | null
  icon: string
  type: 'document' | 'note'
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'done'
  due_date: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Workspace = {
  id: string
  name: string
  owner_id: string
  created_at: string
}
