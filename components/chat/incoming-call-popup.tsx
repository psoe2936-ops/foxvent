'use client'

import { useEffect } from 'react'
import { Phone, PhoneOff } from 'lucide-react'

type IncomingCallPopupProps = {
  callerName: string
  callerAvatar: string | null
  onAccept: () => void
  onDecline: () => void
}

export function IncomingCallPopup({
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
}: IncomingCallPopupProps) {
  // Auto-dismiss after 30 seconds if not answered
  useEffect(() => {
    const timer = setTimeout(onDecline, 30_000)
    return () => clearTimeout(timer)
  }, [onDecline])

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[300px] rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xl">
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
          onClick={onDecline}
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
