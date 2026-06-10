import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, CheckSquare, Plus } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!workspace) redirect('/login')

  const [{ data: recentPages }, { data: recentTasks }] = await Promise.all([
    supabase
      .from('pages')
      .select('id, title, icon, updated_at')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('tasks')
      .select('id, title, status')
      .eq('workspace_id', workspace.id)
      .neq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const name = user.email?.split('@')[0] ?? 'ahí'

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Hola, {name} 👋
      </h1>
      <p className="text-gray-500 mb-10">Bienvenido a Flowspace</p>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link
          href="/tasks"
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all bg-white group"
        >
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <CheckSquare size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Tareas</p>
            <p className="text-xs text-gray-400">
              {recentTasks?.length ?? 0} pendientes
            </p>
          </div>
        </Link>

        <button
          onClick={undefined}
          className="flex items-center gap-3 p-4 border border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-all bg-white group"
        >
          <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
            <Plus size={18} className="text-gray-500" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">Nueva página</p>
            <p className="text-xs text-gray-400">Usá el sidebar</p>
          </div>
        </button>
      </div>

      {/* Recent pages */}
      {recentPages && recentPages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Páginas recientes
          </h2>
          <div className="space-y-1">
            {recentPages.map((page) => (
              <Link
                key={page.id}
                href={`/doc/${page.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">{page.icon}</span>
                <span className="text-sm text-gray-700">{page.title || 'Sin título'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      {recentTasks && recentTasks.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Tareas pendientes
          </h2>
          <div className="space-y-1">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{task.title}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!recentPages?.length && !recentTasks?.length) && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Tu espacio está vacío. ¡Creá tu primera página!</p>
        </div>
      )}
    </div>
  )
}
