import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspaceForUser } from '@/lib/workspace'
import Sidebar from '@/components/sidebar/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getUser() hits Supabase Auth directly — always reliable for identity verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!user.email_confirmed_at) redirect('/confirm-email')

  let workspace = await getWorkspaceForUser(user.id)

  if (!workspace) {
    // Sin workspace propio ni invitación — crear uno nuevo
    const admin = createAdminClient()
    const { data: newWorkspace, error } = await admin
      .from('workspaces')
      .insert({ name: 'Mi espacio', owner_id: user.id })
      .select()
      .single()

    if (newWorkspace) {
      workspace = newWorkspace
      await admin
        .from('workspace_members')
        .insert({ workspace_id: newWorkspace.id, user_id: user.id, role: 'owner' })
    } else {
      console.error('[layout] workspace insert failed:', error?.message, 'user:', user.id)
      const errorMsg = encodeURIComponent(error?.message || 'Error al crear workspace')
      redirect(`/workspace-error?error=${errorMsg}`)
    }
  }

  if (!workspace) redirect('/workspace-error')

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        workspace={workspace}
        userId={user.id}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  )
}
