'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, X } from 'lucide-react'
import type { Page } from '@/types'

interface SearchModalProps {
  workspaceId: string
  open: boolean
  onClose: () => void
}

export default function SearchModal({ workspaceId, open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Pick<Page, 'id' | 'title' | 'icon' | 'parent_id'>[]>([])
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    const { data } = await supabase
      .from('pages')
      .select('id, title, icon, parent_id')
      .eq('workspace_id', workspaceId)
      .ilike('title', `%${q}%`)
      .limit(12)
    if (data) setResults(data)
  }, [supabase, workspaceId])

  useEffect(() => {
    const t = setTimeout(() => search(query), 180)
    return () => clearTimeout(t)
  }, [query, search])

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]) }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/25 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar páginas..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <ul className="py-1.5 max-h-72 overflow-y-auto">
            {results.map(p => (
              <li key={p.id}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  onClick={() => { router.push(`/doc/${p.id}`); onClose() }}
                >
                  <span className="shrink-0">{p.icon ?? '📄'}</span>
                  <span className="text-sm text-gray-800 truncate">{p.title || 'Sin título'}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : query ? (
          <div className="py-8 text-center text-sm text-gray-400">Sin resultados para &ldquo;{query}&rdquo;</div>
        ) : (
          <div className="py-6 text-center text-sm text-gray-400">Escribí para buscar</div>
        )}

        <div className="px-4 py-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">⌘K · Esc para cerrar</span>
        </div>
      </div>
    </div>
  )
}
