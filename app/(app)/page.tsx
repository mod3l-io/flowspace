import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceForUser } from '@/lib/workspace'
import Link from 'next/link'
import { CheckSquare, Circle, Clock, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const workspace = await getWorkspaceForUser(user.id)

  if (!workspace) redirect('/workspace-error')

  const [{ data: recentPages }, { data: tasks }] = await Promise.all([
    supabase
      .from('pages')
      .select('id, title, icon, updated_at')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('tasks')
      .select('id, title, status, due_date')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const pending = tasks?.filter(t => t.status === 'pending') ?? []
  const inProgress = tasks?.filter(t => t.status === 'in_progress') ?? []
  const done = tasks?.filter(t => t.status === 'done') ?? []

  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const name = user.email?.split('@')[0] ?? ''

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      {/* Greeting */}
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 capitalize">{todayLabel}</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Hola, {name}</h1>

      {/* Task summary */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <Link
          href="/tasks"
          className="flex flex-col gap-1 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Circle size={14} />
            <span className="text-xs font-medium">Pendiente</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
        </Link>

        <Link
          href="/tasks"
          className="flex flex-col gap-1 p-4 bg-white border border-blue-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Clock size={14} />
            <span className="text-xs font-medium">En progreso</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{inProgress.length}</p>
        </Link>

        <Link
          href="/tasks"
          className="flex flex-col gap-1 p-4 bg-white border border-green-100 rounded-xl hover:border-green-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <CheckCircle2 size={14} />
            <span className="text-xs font-medium">Listas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{done.length}</p>
        </Link>
      </div>

      {/* In-progress tasks */}
      {inProgress.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={12} className="text-blue-500" />
            En progreso
          </h2>
          <div className="space-y-1.5">
            {inProgress.slice(0, 4).map(task => (
              <Link
                key={task.id}
                href="/tasks"
                className="flex items-center gap-3 px-3 py-2.5 bg-blue-50/50 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <CheckSquare size={14} className="text-blue-400 shrink-0" />
                <span className="text-sm text-gray-800 truncate">{task.title}</span>
                {task.due_date && (
                  <span className="ml-auto text-xs text-gray-400 shrink-0">
                    {format(new Date(task.due_date + 'T00:00:00'), "d MMM", { locale: es })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent pages */}
      {recentPages && recentPages.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Páginas recientes
          </h2>
          <div className="space-y-0.5">
            {recentPages.map(page => (
              <Link
                key={page.id}
                href={`/doc/${page.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="text-base shrink-0">{page.icon}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{page.title || 'Sin título'}</span>
                <span className="text-xs text-gray-300 group-hover:text-gray-400 shrink-0">
                  {format(new Date(page.updated_at), "d MMM", { locale: es })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
