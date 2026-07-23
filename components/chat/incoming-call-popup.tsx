'use client'

import { useEffect, useRef } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type IncomingCallPopupProps = {
  callerName: string
  callerAvatar: string | null
  conversationId: string
  currentUserId: string
  onAccept: () => void
  onDecline: () => void
}

export function IncomingCallPopup({
  callerName,
  callerAvatar,
  conversationId,
  currentUserId,
  onAccept,
  onDecline,
}: IncomingCallPopupProps) {
  const declinedRef = useRef(false)

  // Auto-dismiss after 30 seconds if not answered — insert 'missed' call log
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!declinedRef.current) {
        const supabase = createClient()
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: '',
          message_type: 'call_log',
          call_duration_seconds: 0,
          call_status: 'missed',
        })
      }
      onDecline()
    }, 30_000)
    return () => clearTimeout(timer)
  }, [conversationId, currentUserId, onDecline])

  const handleDecline = async () => {
    declinedRef.current = true
    const supabase = createClient()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: '',
      message_type: 'call_log',
      call_duration_seconds: 0,
      call_status: 'declined',
    })
    onDecline()
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 w-75 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150 ring-2 ring-[#F36D21]/30">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {callerAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={callerAvatar}
              alt=""
              className="size-11 rounded-full bg-[#F3F4F6] object-cover"
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-full bg-[#F3F4F6] text-sm font-semibold text-[#6B7280]">
              {(callerName[0] ?? '?').toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 size-3 animate-pulse rounded-full border-2 border-white bg-green-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Incoming video call
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-[#1F2937]">
            {callerName}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDecline}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FDEDEC] py-2.5 text-sm font-semibold text-[#C0392B] hover:opacity-90"
        >
          <PhoneOff className="size-4" />
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#E8F5E9] py-2.5 text-sm font-semibold text-[#1A7A4A] hover:opacity-90"
        >
          <Phone className="size-4" />
          Accept
        </button>
      </div>
    </div>
  )
}
