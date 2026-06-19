'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type LoginState = {
  error: string
  needsConfirmation?: boolean
  email?: string
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get('email') as string) ?? ''
  const password = (formData.get('password') as string) ?? ''

  if (!email || !password) {
    return { error: 'Email y contraseña requeridos', email }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Tu email no está confirmado todavía.', needsConfirmation: true, email }
    }
    return { error: error.message, email }
  }

  if (!data.user?.email_confirmed_at) {
    return { error: 'Tu email no está confirmado todavía.', needsConfirmation: true, email }
  }

  // Invalidate the Next.js client-side router cache so that RSC responses
  // cached while unauthenticated (containing redirect-to-login instructions)
  // are not replayed after a successful login.
  revalidatePath('/', 'layout')
  redirect('/')
}
