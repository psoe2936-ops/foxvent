import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle explicit errors from Supabase
  if (error || errorDescription) {
    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set(
      'message',
      errorDescription ?? error ?? 'Authentication was cancelled or failed.'
    )
    return NextResponse.redirect(errorUrl)
  }

  const supabase = await createClient()

  // Handle password reset (token_hash flow)
  if (tokenHash && type === 'recovery') {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    })

    if (!verifyError) {
      // Successfully verified — redirect to reset password page
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set(
      'message',
      verifyError.message ?? 'Reset link is invalid or has expired.'
    )
    return NextResponse.redirect(errorUrl)
  }

  // Handle email verification (token_hash flow, type=email)
  if (tokenHash && type === 'email') {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    })

    if (!verifyError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set(
      'message',
      verifyError.message ?? 'Email verification link is invalid or has expired.'
    )
    return NextResponse.redirect(errorUrl)
  }

  // Handle OAuth code flow (Google OAuth)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set('message', exchangeError.message)
    return NextResponse.redirect(errorUrl)
  }

  // No valid params found
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('message', 'Missing authentication code.')
  return NextResponse.redirect(errorUrl)
}