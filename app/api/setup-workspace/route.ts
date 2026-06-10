import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SITE_URL = 'https://flowspace-weld-one.vercel.app'

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Forzar refresh para obtener un token fresco
  await supabase.auth.refreshSession()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', SITE_URL))
  }

  const { access_token, user } = session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Verificar si ya tiene workspace
  const selectRes = await fetch(
    `${supabaseUrl}/rest/v1/workspaces?owner_id=eq.${user.id}&limit=1&select=id`,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'apikey': anonKey,
      },
    }
  )
  const existing = await selectRes.json()

  if (!existing || existing.length === 0) {
    // Crear workspace con el token fresco explícito
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
        'apikey': anonKey,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ name: 'Mi espacio', owner_id: user.id }),
    })

    const workspace = await insertRes.json()

    if (!insertRes.ok) {
      return NextResponse.json({ error: workspace?.message || 'Error al crear workspace', token_sub: user.id }, { status: 500 })
    }

    const workspaceId = workspace[0]?.id
    if (workspaceId) {
      await fetch(`${supabaseUrl}/rest/v1/workspace_members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ workspace_id: workspaceId, user_id: user.id, role: 'owner' }),
      })
    }
  }

  const response = NextResponse.redirect(new URL('/', SITE_URL))
  cookieStore.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value)
  })
  return response
}
