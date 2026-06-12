import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/sidebar/Sidebar'
import type { Workspace } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getUser() hits Supabase Auth directly — always reliable for identity verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!user.email_confirmed_at) redirect('/confirm-email')

  // Use admin client for workspace operations — bypasses RLS safely since
  // identity is already verified above and all queries are filtered by user.id
  const admin = createAdminClient()
  let workspace: Workspace | null = null

  // 1. Buscar workspace propio
  const { data: ownedRows } = await admin
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)

  if (ownedRows && ownedRows.length > 0) {
    workspace = ownedRows[0]
  } else {
    // 2. Buscar workspace al que fue invitado
    const { data: memberRows } = await admin
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id)
      .limit(1)

    if (memberRows && memberRows.length > 0 && memberRows[0].workspaces) {
      workspace = memberRows[0].workspaces as unknown as Workspace
    } else {
      // 3. Crear workspace nuevo
      const { data: newWorkspace, error } = await admin
        .from('workspaces')
        .insert({ name: 'Mi espacio', owner_id: user.id })
        .select()
        .single()

      if (newWorkspace) {
        workspace = newWorkspace
        await admin
          .from('workspace_members')
          .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })
      } else {
        console.error('[layout] workspace insert failed:', error?.message, 'user:', user.id)
        const errorMsg = encodeURIComponent(error?.message || 'Error al crear workspace')
        redirect(`/workspace-error?error=${errorMsg}`)
      }
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
