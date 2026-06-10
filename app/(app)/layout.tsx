import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar/Sidebar'
import type { Workspace } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Buscar workspace propio
  let workspace: Workspace | null = null
  const { data: owned } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle()

  if (owned) {
    workspace = owned as Workspace
  } else {
    // 2. Buscar workspace al que fue invitado
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(*)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (membership?.workspaces) {
      workspace = (membership.workspaces as unknown) as Workspace
    } else {
      // 3. Crear workspace nuevo
      const { data: created, error: insertError } = await supabase
        .from('workspaces')
        .insert({ name: 'Mi espacio', owner_id: user.id })
        .select()
        .single()

      if (created) {
        workspace = created as Workspace
        await supabase.from('workspace_members').insert({
          workspace_id: created.id,
          user_id: user.id,
          role: 'owner',
        })
      } else {
        console.error('Workspace insert failed:', insertError?.message, insertError?.code, 'user:', user.id)
      }
    }
  }

  if (!workspace) {
    redirect('/api/setup-workspace')
  }

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
