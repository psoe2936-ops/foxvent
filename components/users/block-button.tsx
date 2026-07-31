'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

type Props = {
  targetUserId: string
  targetUsername: string
  viewerId: string
  initialBlocked: boolean
  onBlockChange?: (isBlocked: boolean) => void
}

export function BlockButton({
  targetUserId,
  targetUsername,
  viewerId,
  initialBlocked,
  onBlockChange,
}: Props) {
  const t = useTranslations('chat')
  const tSafety = useTranslations('safety')
  const tCommon = useTranslations('common')
  const [isBlocked, setIsBlocked] = useState(initialBlocked)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError(tSafety('failed'))
        return
      }

      if (isBlocked) {
        const { error: dbErr } = await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', targetUserId)
        if (dbErr) { setError(tSafety('failed')); return }
        setIsBlocked(false)
        onBlockChange?.(false)
      } else {
        const { error: dbErr } = await supabase
          .from('blocks')
          .upsert({ blocker_id: user.id, blocked_id: targetUserId }, { onConflict: 'blocker_id,blocked_id' })
        if (dbErr) { setError(tSafety('failed')); return }
        setIsBlocked(true)
        onBlockChange?.(true)
      }
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <p className="text-sm font-medium text-[#1F2937]">
          {isBlocked
            ? t('unblockConfirmTitle', { username: targetUsername })
            : t('blockConfirmTitle', { username: targetUsername })}
        </p>
        {!isBlocked && (
          <p className="mt-1 text-xs text-[#6B7280]">
            {t('blockWarning')}
          </p>
        )}
        {error && <p className="mt-1 text-xs text-[#C0392B]">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-60"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-lg bg-[#C0392B] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? '…' : isBlocked ? t('unblockAction') : t('blockAction')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={
        isBlocked
          ? 'rounded-lg border border-[#C0392B]/40 px-3 py-1.5 text-xs font-medium text-[#C0392B] transition-colors hover:bg-[#FDEDEC]'
          : 'rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]'
      }
    >
      {isBlocked ? tSafety('blockedState') : t('blockAction')}
    </button>
  )
}
