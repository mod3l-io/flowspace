import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BlockEditor from '@/components/editor/BlockEditor'
import type { Page } from '@/types'

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single()

  if (!page) notFound()

  return <BlockEditor page={page as Page} />
}
