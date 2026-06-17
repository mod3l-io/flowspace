import { createAdminClient } from '@/lib/supabase/admin'
import type { Workspace } from '@/types'

export async function getWorkspaceForUser(userId: string): Promise<Workspace | null> {
  const admin = createAdminClient()

  const { data: ownedRows } = await admin
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .limit(1)

  if (ownedRows && ownedRows.length > 0) return ownedRows[0]

  const { data: memberRows } = await admin
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', userId)
    .limit(1)

  if (memberRows && memberRows.length > 0 && memberRows[0].workspaces) {
    return memberRows[0].workspaces as unknown as Workspace
  }

  return null
}
