import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimitByIdentifier } from '@/lib/rate-limit'

const LIMITS: Record<string, { max: number; windowMinutes: number }> = {
  signup: { max: 5, windowMinutes: 60 },
  login: { max: 10, windowMinutes: 15 },
  otp_verify: { max: 8, windowMinutes: 15 },
  otp_resend: { max: 3, windowMinutes: 10 },
  password_reset: { max: 3, windowMinutes: 60 },
}

export async function POST(request: NextRequest) {
  let body: { email?: string; action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, action } = body

  if (!email || !action || !LIMITS[action]) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { max, windowMinutes } = LIMITS[action]

  // Use normalized email as identifier (case-insensitive)
  const identifier = email.toLowerCase().trim()

  const result = await checkRateLimitByIdentifier(
    supabase, identifier, action, max, windowMinutes
  )

  if (!result.allowed) {
    return NextResponse.json(
      {
        allowed: false,
        retryAfterSeconds: result.retryAfterSeconds
      },
      { status: 429 }
    )
  }

  return NextResponse.json({ allowed: true })
}
