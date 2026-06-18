import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return allCookies },
        setAll() {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  return NextResponse.json({
    user: user ? {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
    } : null,
    error: error?.message ?? null,
    supabaseCookies: allCookies
      .filter(c => c.name.startsWith('sb-'))
      .map(c => c.name),
    totalCookies: allCookies.length,
  })
}
