'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  blockerId: string
  blockedId: string
}

export function UnblockButton({ blockerId, blockedId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  function handleConfirm() {
    startTransition(async () => {
      await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="rounded-lg bg-[#C0392B] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? '…' : 'Unblock'}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
    >
      Unblock
    </button>
  )
}
