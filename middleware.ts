import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/profile',
  '/products/new',
  '/chat',
  '/wishlist',
  '/following',
  '/feed/wishlist',
  '/feed/messages',
  '/feed/notifications',
  '/feed/listings',
  '/feed/following',
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Fetch user profile once for all logged-in users (reused for ban check + admin check)
  let userProfile: {
    role: string
    is_banned: boolean
    banned_until: string | null
    ban_reason: string | null
  } | null = null

  if (user && !path.startsWith('/banned')) {
    const { data } = await supabase
      .from('users')
      .select('role, is_banned, banned_until, ban_reason')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  // Ban check — skip for admins and the /banned page itself
  if (
    user &&
    userProfile &&
    userProfile.is_banned &&
    userProfile.role !== 'admin' &&
    !path.startsWith('/banned')
  ) {
    const bannedUntil = userProfile.banned_until
    const isExpired = bannedUntil !== null && new Date(bannedUntil) <= new Date()

    if (isExpired) {
      // Auto-unban expired temporary ban; allow through
      await supabase
        .from('users')
        .update({ is_banned: false, banned_until: null, ban_reason: null })
        .eq('id', user.id)
    } else {
      const redirect = NextResponse.redirect(new URL('/banned', request.url))
      supabaseResponse.cookies.getAll().forEach((c) =>
        redirect.cookies.set(c.name, c.value)
      )
      return redirect
    }
  }

  const isProtected = PROTECTED_ROUTES.some((route) => path.startsWith(route))

  if (isProtected && !user) {
    const redirectUrl = new URL('/feed', request.url)
    redirectUrl.searchParams.set('login', '1')
    redirectUrl.searchParams.set('next', path)
    const redirect = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((c) =>
      redirect.cookies.set(c.name, c.value)
    )
    return redirect
  }

  // Admin route guard
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
