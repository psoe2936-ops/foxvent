'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReportUserModal } from '@/components/users/report-user-modal'

type Props = {
  targetUserId: string
  targetUsername: string
  viewerId: string
  initialBlocked: boolean
}

export function UserSafetyMenu({
  targetUserId,
  targetUsername,
  viewerId,
  initialBlocked,
}: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'menu' | 'block-confirm'>('menu')
  const [isBlocked, setIsBlocked] = useState(initialBlocked)
  const [reportOpen, setReportOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setMode('menu')
        setError(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleBlockConfirm() {
    setError(null)
    startTransition(async () => {
      if (isBlocked) {
        const { error: dbErr } = await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', viewerId)
          .eq('blocked_id', targetUserId)
        if (dbErr) { setError('Failed. Please try again.'); return }
        setIsBlocked(false)
      } else {
        const { error: dbErr } = await supabase
          .from('blocks')
          .upsert({ blocker_id: viewerId, blocked_id: targetUserId }, { onConflict: 'blocker_id,blocked_id' })
        if (dbErr) { setError('Failed. Please try again.'); return }
        setIsBlocked(true)
      }
      setOpen(false)
      setMode('menu')
    })
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setMode('menu'); setError(null) }}
          aria-label="More options"
          className="flex size-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
        >
          <MoreHorizontal className="size-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
            {mode === 'menu' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('block-confirm')}
                  className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-[#F9FAFB] ${
                    isBlocked ? 'text-[#C0392B]' : 'text-[#374151]'
                  }`}
                >
                  {isBlocked ? `Unblock @${targetUsername}` : `Block @${targetUsername}`}
                </button>
                <div className="h-px bg-[#F3F4F6]" />
                <button
                  type="button"
                  onClick={() => { setOpen(false); setReportOpen(true) }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                >
                  Report user
                </button>
              </>
            ) : (
              <div className="p-3">
                <p className="text-sm font-medium text-[#1F2937]">
                  {isBlocked ? `Unblock @${targetUsername}?` : `Block @${targetUsername}?`}
                </p>
                {!isBlocked && (
                  <p className="mt-1 text-xs text-[#6B7280]">
                    They won&apos;t be able to message you. Unblock anytime from Settings.
                  </p>
                )}
                {error && <p className="mt-1 text-xs text-[#C0392B]">{error}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('menu'); setError(null) }}
                    disabled={isPending}
                    className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleBlockConfirm}
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-[#C0392B] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {isPending ? '…' : isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {reportOpen && (
        <ReportUserModal
          targetUserId={targetUserId}
          targetUsername={targetUsername}
          reporterId={viewerId}
          onClose={() => setReportOpen(false)}
        />
      )}
    </>
  )
}
