import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error || errorDescription) {
    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set(
      'message',
      errorDescription ?? error ?? 'Authentication was cancelled or failed.'
    )

    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set('message', error.message)

    return NextResponse.redirect(errorUrl)
  }

  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('message', 'Missing authentication code.')

  return NextResponse.redirect(errorUrl)
}
