'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [supabase])

  const handleResend = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reenviar')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-4">
          <span className="text-2xl">✉</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Confirmá tu email</h1>
        <p className="text-sm text-gray-500 mb-1">
          Enviamos un link de confirmación a:
        </p>
        <p className="text-sm font-medium text-gray-900 mb-6">{email}</p>

        {success ? (
          <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4">
            ¡Email reenviado! Revisá tu casilla (y el spam).
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-6">
              ¿No llegó? Revisá la carpeta de spam o reenviá el email.
            </p>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</div>
            )}
            <button
              onClick={handleResend}
              disabled={loading || !email}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
            >
              {loading ? 'Enviando...' : 'Reenviar email de confirmación'}
            </button>
          </>
        )}

        <button
          onClick={handleLogout}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Usar otra cuenta
        </button>
      </div>
    </div>
  )
}
