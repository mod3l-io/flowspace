'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { createClient } from '@/lib/supabase/client'
import type { Page } from '@/types'

interface BlockEditorProps {
  page: Page
}

export default function BlockEditor({ page }: BlockEditorProps) {
  const [title, setTitle] = useState(page.title)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastSavedAt = useRef<string>(page.updated_at)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote({
    initialContent: (page.content as any) ?? undefined,
  })

  const saveContent = useCallback(
    async (updates: { title?: string; content?: unknown }) => {
      setSaveStatus('saving')
      const { data } = await supabase
        .from('pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', page.id)
        .select('updated_at')
        .single()
      if (data) {
        lastSavedAt.current = data.updated_at
        setSaveStatus('saved')
      }
    },
    [supabase, page.id]
  )

  const scheduleSave = useCallback(
    (updates: { title?: string; content?: unknown }) => {
      setSaveStatus('unsaved')
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveContent(updates), 1500)
    },
    [saveContent]
  )

  // Realtime: recibir cambios de otros usuarios
  useEffect(() => {
    const channel = supabase
      .channel(`page-${page.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pages', filter: `id=eq.${page.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (
            payload.new.updated_at !== lastSavedAt.current &&
            saveStatus === 'saved'
          ) {
            if (payload.new.content) {
              editor.replaceBlocks(editor.document, payload.new.content)
            }
            if (payload.new.title && payload.new.title !== title) {
              setTitle(payload.new.title)
            }
            lastSavedAt.current = payload.new.updated_at
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, page.id, editor, title, saveStatus])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title */}
      <div className="px-14 pt-14 pb-2 shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            scheduleSave({ title: e.target.value })
          }}
          placeholder="Sin título"
          className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 outline-none bg-transparent resize-none"
        />
      </div>

      {/* Save indicator */}
      <div className="px-14 pb-4 shrink-0">
        <span className="text-xs text-neutral-400">
          {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'unsaved' ? '● Sin guardar' : 'Guardado'}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={() => scheduleSave({ content: editor.document })}
          className="min-h-full"
        />
      </div>
    </div>
  )
}
