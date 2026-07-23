import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Verify user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  let body: { channelName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const channelName = body?.channelName
  if (!channelName || typeof channelName !== 'string') {
    return NextResponse.json({ error: 'channelName is required' }, { status: 400 })
  }

  // 3. Verify user is a participant in this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', channelName)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Generate Agora token — AGORA_APP_CERTIFICATE is server-side only
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    0,
    RtcRole.PUBLISHER,
    privilegeExpiredTs,
    privilegeExpiredTs,
  )

  return NextResponse.json({ token, channelName })
}
