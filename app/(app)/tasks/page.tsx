import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskBoard from '@/components/tasks/TaskBoard'
import type { Workspace } from '@/types'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) redirect('/')

  return <TaskBoard workspace={workspace as Workspace} userId={user.id} />
}
