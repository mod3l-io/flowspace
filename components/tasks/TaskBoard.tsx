'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, Workspace } from '@/types'
import { Plus, Circle, Clock, CheckCircle2, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', icon: Circle, color: 'text-gray-400', bg: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'En progreso', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 text-blue-700' },
  done: { label: 'Listo', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100 text-green-700' },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

interface TaskBoardProps {
  workspace: Workspace
  userId: string
}

export default function TaskBoard({ workspace, userId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<StatusKey | 'all'>('all')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
    if (data) setTasks(data as Task[])
  }, [supabase, workspace.id])

  useEffect(() => {
    loadTasks()
    const channel = supabase
      .channel(`tasks-${workspace.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspace.id}` },
        loadTasks
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadTasks, supabase, workspace.id])

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    await supabase.from('tasks').insert({
      workspace_id: workspace.id,
      title: newTaskTitle.trim(),
      status: 'pending',
      due_date: dueDate || null,
      created_by: userId,
    })
    setNewTaskTitle('')
    setDueDate('')
    setAdding(false)
  }

  const cycleStatus = async (task: Task) => {
    const order: StatusKey[] = ['pending', 'in_progress', 'done']
    const next = order[(order.indexOf(task.status) + 1) % order.length]
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
        >
          <Plus size={15} />
          Nueva tarea
        </button>
      </div>

      {/* Add task form */}
      {adding && (
        <form onSubmit={createTask} className="mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="¿Qué hay que hacer?"
            className="w-full text-sm outline-none placeholder-gray-400 text-gray-900"
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar size={14} />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="outline-none text-sm text-gray-600"
              />
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => { setAdding(false); setNewTaskTitle(''); setDueDate('') }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
            >
              Agregar
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(['all', 'pending', 'in_progress', 'done'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {key === 'all' ? 'Todas' : STATUS_CONFIG[key].label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filter === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay tareas{filter !== 'all' ? ' en este estado' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const cfg = STATUS_CONFIG[task.status]
            const Icon = cfg.icon
            return (
              <div
                key={task.id}
                className="group flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => cycleStatus(task)}
                  title="Cambiar estado"
                  className={`mt-0.5 shrink-0 ${cfg.color} hover:scale-110 transition-transform`}
                >
                  <Icon size={18} />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} />
                      {format(new Date(task.due_date + 'T00:00:00'), "d 'de' MMM", { locale: es })}
                    </p>
                  )}
                </div>

                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg}`}>
                  {cfg.label}
                </span>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
