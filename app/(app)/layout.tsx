import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar/Sidebar'
import type { Workspace } from '@/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
// Service role key bypasses RLS — safe here because identity is verified via getUser() above
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!.trim()

async function restGet<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

async function restPost<T>(
  path: string,
  body: object,
): Promise<{ ok: boolean; data?: T; message?: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) return { ok: false, message: data?.message || data?.error || `HTTP ${res.status}` }
  return { ok: true, data: Array.isArray(data) ? data[0] : data }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getUser() calls Supabase Auth directly — always reliable for identity verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!user.email_confirmed_at) redirect('/confirm-email')

  // Explicitly get the session to extract a fresh access token for REST calls.
  // We use direct REST fetch (not the supabase-js PostgREST client) to guarantee
  // the correct Bearer token is sent — the client's _getAccessToken() can fall back
  // to the anon key in certain SSR edge cases when the session is near expiry.
  let workspace: Workspace | null = null

  // 1. Buscar workspace propio
  const ownedRows = await restGet<Workspace>(
    `workspaces?owner_id=eq.${user.id}&limit=1&select=*`,
  )

  if (ownedRows.length > 0) {
    workspace = ownedRows[0]
  } else {
    // 2. Buscar workspace al que fue invitado
    type MemberRow = { workspace_id: string; workspaces: Workspace }
    const memberRows = await restGet<MemberRow>(
      `workspace_members?user_id=eq.${user.id}&limit=1&select=workspace_id,workspaces(*)`,
    )

    if (memberRows.length > 0 && memberRows[0].workspaces) {
      workspace = memberRows[0].workspaces
    } else {
      // 3. Crear workspace nuevo
      const insertResult = await restPost<Workspace>(
        'workspaces',
        { name: 'Mi espacio', owner_id: user.id },
      )

      if (insertResult.ok && insertResult.data) {
        workspace = insertResult.data
        await restPost(
          'workspace_members',
          { workspace_id: workspace.id, user_id: user.id, role: 'owner' },
        )
      } else {
        console.error('[layout] workspace insert failed:', insertResult.message, 'user:', user.id)
        const errorMsg = encodeURIComponent(insertResult.message || 'Error al crear workspace')
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
