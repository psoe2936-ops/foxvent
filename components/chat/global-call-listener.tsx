'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { IncomingCallPopup } from '@/components/chat/incoming-call-popup'

type IncomingCall = {
  conversationId: string
  callerName: string
  callerAvatar: string | null
}

export function GlobalCallListener({ currentUserId }: { currentUserId: string }) {
  const [conversationIds, setConversationIds] = useState<string[]>([])
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Keep a ref so event callbacks always read the current pathname without
  // needing it as a dependency (avoids re-subscribing on every navigation).
  const pathnameRef = useRef(pathname)
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Step 1 — fetch all conversation IDs this user participates in
  useEffect(() => {
    supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setConversationIds(data.map((c: { id: string }) => c.id))
        }
      })
  }, [currentUserId, supabase])

  // Step 2 — subscribe to each conversation's call broadcast channel
  useEffect(() => {
    if (conversationIds.length === 0) return

    const channels: RealtimeChannel[] = conversationIds.map((conversationId) =>
      supabase
        .channel(`gcall:${conversationId}`)
        .on('broadcast', { event: 'incoming_call' }, (payload) => {
          const { callerId, callerName, callerAvatar } = payload.payload as {
            callerId: string
            callerName: string
            callerAvatar: string | null
          }
          // Ignore events we ourselves sent
          if (callerId === currentUserId) return
          // Skip the global popup when already inside that conversation thread —
          // the in-thread IncomingCallPopup handles it there
          if (pathnameRef.current === `/chat/${conversationId}`) return
          setIncomingCall({ conversationId, callerName, callerAvatar })
        })
        .subscribe()
    )

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [conversationIds, currentUserId, supabase])

  if (!incomingCall) return null

  return (
    <IncomingCallPopup
      callerName={incomingCall.callerName}
      callerAvatar={incomingCall.callerAvatar}
      onAccept={() => {
        const id = incomingCall.conversationId
        setIncomingCall(null)
        router.push(`/chat/${id}?call=accept`)
      }}
      onDecline={() => setIncomingCall(null)}
    />
  )
}
