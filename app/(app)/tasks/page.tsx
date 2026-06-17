import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceForUser } from '@/lib/workspace'
import TaskBoard from '@/components/tasks/TaskBoard'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const workspace = await getWorkspaceForUser(user.id)

  if (!workspace) redirect('/')

  return <TaskBoard workspace={workspace} userId={user.id} />
}
