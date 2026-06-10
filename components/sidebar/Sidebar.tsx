'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Page, Workspace } from '@/types'
import {
  CheckSquare,
  Plus,
  ChevronRight,
  ChevronDown,
  LogOut,
  Trash2,
  Link2,
  FileText,
} from 'lucide-react'

interface SidebarProps {
  workspace: Workspace
  userId: string
  userEmail: string
}

export default function Sidebar({ workspace, userId, userEmail }: SidebarProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const loadPages = useCallback(async () => {
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: true })
    if (data) setPages(data as Page[])
  }, [supabase, workspace.id])

  useEffect(() => {
    loadPages()
    const channel = supabase
      .channel(`sidebar-${workspace.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pages', filter: `workspace_id=eq.${workspace.id}` },
        loadPages
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadPages, supabase, workspace.id])

  const createPage = async (parentId: string | null = null) => {
    const { data } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspace.id,
        parent_id: parentId,
        title: 'Sin título',
        content: null,
        created_by: userId,
        type: 'document',
      })
      .select()
      .single()
    if (data) {
      if (parentId) setExpanded(prev => new Set([...prev, parentId]))
      router.push(`/doc/${data.id}`)
    }
  }

  const deletePage = async (pageId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('¿Eliminar esta página y sus subpáginas?')) return
    await supabase.from('pages').delete().eq('id', pageId)
    if (pathname === `/doc/${pageId}`) router.push('/')
  }

  const toggleExpand = (pageId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(pageId)) next.delete(pageId)
      else next.add(pageId)
      return next
    })
  }

  const copyInviteLink = async () => {
    const url = `${window.location.origin}/join/${workspace.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const renderPage = (page: Page, depth = 0): React.ReactNode => {
    const children = pages.filter(p => p.parent_id === page.id)
    const isExpanded = expanded.has(page.id)
    const isActive = pathname === `/doc/${page.id}`

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-0.5 rounded-md text-sm cursor-pointer select-none ${isActive ? 'bg-neutral-200/80' : 'hover:bg-neutral-100'}`}
          style={{ paddingLeft: `${depth * 12 + 4}px`, paddingRight: '4px' }}
        >
          <button
            className="w-5 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700 shrink-0"
            onClick={() => children.length > 0 && toggleExpand(page.id)}
          >
            {children.length > 0 ? (
              isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            ) : (
              <span className="w-3" />
            )}
          </button>

          <Link
            href={`/doc/${page.id}`}
            className="flex items-center gap-1.5 flex-1 min-w-0 py-1"
          >
            <span className="text-sm shrink-0">{page.icon}</span>
            <span className="truncate text-neutral-700">{page.title || 'Sin título'}</span>
          </Link>

          <div className="hidden group-hover:flex items-center shrink-0">
            <button
              title="Agregar subpágina"
              className="p-1 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600"
              onClick={() => createPage(page.id)}
            >
              <Plus size={12} />
            </button>
            <button
              title="Eliminar página"
              className="p-1 rounded hover:bg-red-100 text-neutral-400 hover:text-red-500"
              onClick={(e) => deletePage(page.id, e)}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {isExpanded && children.map(child => renderPage(child, depth + 1))}
      </div>
    )
  }

  const rootPages = pages.filter(p => !p.parent_id)

  return (
    <div className="w-60 h-full flex flex-col bg-[#f7f7f5] border-r border-[#e9e9e7] shrink-0">
      {/* Workspace header */}
      <div className="px-3 py-3 flex items-center justify-between border-b border-[#e9e9e7]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 bg-gray-900 text-white text-xs rounded-md flex items-center justify-center font-bold shrink-0">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm text-gray-900 truncate">{workspace.name}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <Link
          href="/tasks"
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${pathname === '/tasks' ? 'bg-neutral-200/80 text-gray-900' : 'text-neutral-600 hover:bg-neutral-100'}`}
        >
          <CheckSquare size={15} />
          <span>Tareas</span>
        </Link>

        <Link
          href="/"
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${pathname === '/' ? 'bg-neutral-200/80 text-gray-900' : 'text-neutral-600 hover:bg-neutral-100'}`}
        >
          <FileText size={15} />
          <span>Inicio</span>
        </Link>

        {/* Pages section */}
        <div className="pt-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Páginas</span>
            <button
              title="Nueva página"
              onClick={() => createPage()}
              className="p-0.5 rounded hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700"
            >
              <Plus size={14} />
            </button>
          </div>

          {rootPages.length === 0 ? (
            <button
              onClick={() => createPage()}
              className="w-full text-left px-3 py-2 text-xs text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md"
            >
              + Nueva página
            </button>
          ) : (
            <div className="space-y-0">{rootPages.map(p => renderPage(p))}</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e9e9e7] p-2 space-y-1">
        <button
          onClick={copyInviteLink}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md"
        >
          <Link2 size={13} />
          <span>{copied ? '¡Link copiado!' : 'Invitar colaborador'}</span>
        </button>
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-neutral-500 truncate max-w-[140px]">{userEmail}</span>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded hover:bg-neutral-100"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
