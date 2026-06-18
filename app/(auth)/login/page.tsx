'use client'

import { useState, useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [clientError, setClientError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const supabase = createClient()

  // Server Action: sets session server-side → HTTP redirect to / → clears Next.js RSC cache
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, { error: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
        })
        if (error) throw error
        setSuccess('¡Cuenta creada! Revisá tu email para confirmarla.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSuccess('¡Listo! Revisá tu email para resetear la contraseña.')
      }
    } catch (err: unknown) {
      setClientError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const resendEmail = loginState.email || email
    if (!resendEmail) return
    setResendLoading(true)
    setResendSuccess('')
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: resendEmail })
      if (error) throw error
      setResendSuccess('¡Email reenviado! Revisá tu casilla y el spam.')
    } catch {
      // ignore resend errors silently
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-4">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Flowspace</h1>
          <p className="text-sm text-gray-500 mt-1">Tu espacio de trabajo colaborativo</p>
        </div>

        {/* Toggle */}
        {mode !== 'forgot' && (
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setMode('login'); setClientError(''); setSuccess('') }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setMode('signup'); setClientError(''); setSuccess('') }}
            >
              Crear cuenta
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recuperar contraseña</h2>
            <p className="text-sm text-gray-500 mt-1">Te enviamos un link a tu email para crear una nueva.</p>
          </div>
        )}

        {/* LOGIN: Server Action form — avoids Next.js RSC cache issue on redirect */}
        {mode === 'login' && (
          <form action={loginFormAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setClientError(''); setSuccess('') }}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {loginState.error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{loginState.error}</div>
            )}
            {loginState.needsConfirmation && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {resendLoading ? 'Enviando...' : 'Reenviar email de confirmación'}
              </button>
            )}
            {resendSuccess && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{resendSuccess}</div>
            )}

            <button
              type="submit"
              disabled={loginPending}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loginPending ? 'Cargando...' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {/* SIGNUP / FORGOT: client-side form */}
        {mode !== 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {clientError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{clientError}</div>
            )}
            {success && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Cargando...' : mode === 'signup' ? 'Crear cuenta' : 'Enviar link'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setClientError(''); setSuccess('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Volver al login
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
