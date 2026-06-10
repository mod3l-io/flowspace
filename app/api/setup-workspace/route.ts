import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          // Route Handlers SÍ pueden setear cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://flowspace-weld-one.vercel.app'))

  // Buscar workspace existente
  const { data: owned } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!owned) {
    // Crear workspace nuevo
    const { data: created, error } = await supabase
      .from('workspaces')
      .insert({ name: 'Mi espacio', owner_id: user.id })
      .select('id')
      .single()

    if (created) {
      await supabase.from('workspace_members').insert({
        workspace_id: created.id,
        user_id: user.id,
        role: 'owner',
      })
    } else {
      console.error('setup-workspace insert error:', error?.message, error?.code)
      return NextResponse.json({ error: error?.message }, { status: 500 })
    }
  }

  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'https://flowspace-weld-one.vercel.app'))
  // Copiar cookies actualizadas (token refrescado) a la respuesta
  cookieStore.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value)
  })
  return response
}
