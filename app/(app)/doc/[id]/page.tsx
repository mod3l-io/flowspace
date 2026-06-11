import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BlockEditor from '@/components/editor/BlockEditor'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Page } from '@/types'

type BreadcrumbPage = Pick<Page, 'id' | 'title' | 'icon' | 'parent_id'>

function buildAncestors(currentId: string, all: BreadcrumbPage[]): BreadcrumbPage[] {
  const map = new Map(all.map(p => [p.id, p]))
  const chain: BreadcrumbPage[] = []
  let cursor = map.get(currentId)
  while (cursor?.parent_id) {
    const parent = map.get(cursor.parent_id)
    if (!parent) break
    chain.unshift(parent)
    cursor = parent
  }
  return chain
}

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

  const { data: allPages } = await supabase
    .from('pages')
    .select('id, title, icon, parent_id')
    .eq('workspace_id', page.workspace_id)

  const ancestors = allPages ? buildAncestors(id, allPages) : []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumbs */}
      {ancestors.length > 0 && (
        <div className="flex items-center gap-1 px-14 pt-6 pb-0 shrink-0 flex-wrap">
          {ancestors.map((ancestor, i) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
              <Link
                href={`/doc/${ancestor.id}`}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span>{ancestor.icon}</span>
                <span>{ancestor.title || 'Sin título'}</span>
              </Link>
            </span>
          ))}
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-xs text-gray-500 font-medium">{page.title || 'Sin título'}</span>
        </div>
      )}

      <BlockEditor page={page as Page} />
    </div>
  )
}
