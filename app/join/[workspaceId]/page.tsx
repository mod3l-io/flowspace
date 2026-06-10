import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function JoinWorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/join/${workspaceId}`)
  }

  // Verificar que el workspace existe
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    redirect('/?error=workspace_not_found')
  }

  // Agregar como miembro si no lo es ya
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    await supabase.from('workspace_members').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role: 'member',
    })
  }

  redirect(`/?joined=${workspace.name}`)
}
