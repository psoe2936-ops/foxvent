'use client'

import { useState, useTransition } from 'react'
import { banUser, unbanUser } from '@/app/admin/users/actions'

type BanDuration = '24h' | '7d' | '30d' | 'permanent'

const DURATION_OPTIONS: { value: BanDuration; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'permanent', label: 'Permanent' },
]

export function BanButton({
  userId,
  username,
  isBanned,
}: {
  userId: string
  username: string
  isBanned: boolean
}) {
  const [banOpen, setBanOpen] = useState(false)
  const [unbanConfirm, setUnbanConfirm] = useState(false)
  const [duration, setDuration] = useState<BanDuration>('24h')
  const [reason, setReason] = useState('')
  const [banError, setBanError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleBan() {
    const trimmed = reason.trim()
    if (trimmed.length < 10) return
    setBanError(null)
    startTransition(async () => {
      const result = await banUser(userId, duration, trimmed)
      if ('error' in result) {
        setBanError(result.error)
        return
      }
      setBanOpen(false)
      setReason('')
    })
  }

  function handleUnban() {
    startTransition(async () => {
      await unbanUser(userId)
      setUnbanConfirm(false)
    })
  }

  if (isBanned) {
    return (
      <>
        {unbanConfirm ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#6B7280]">Unban @{username}?</span>
            <button
              onClick={handleUnban}
              disabled={isPending}
              className="rounded px-2 py-0.5 text-xs font-medium text-[#1A7A4A] hover:bg-[#E8F5E9] disabled:opacity-50"
            >
              {isPending ? '…' : 'Confirm'}
            </button>
            <button
              onClick={() => setUnbanConfirm(false)}
              className="rounded px-2 py-0.5 text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setUnbanConfirm(true)}
            className="rounded-lg border border-[#1A7A4A] px-2.5 py-1 text-xs font-medium text-[#1A7A4A] hover:bg-[#E8F5E9]"
          >
            Unban
          </button>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setBanOpen(true)}
        className="rounded-lg border border-[#C0392B] px-2.5 py-1 text-xs font-medium text-[#C0392B] hover:bg-[#FDEDEC]"
      >
        Ban
      </button>

      {banOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setBanOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white/95 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
          >
            <h3 className="font-semibold text-[#2D2E32]">Ban @{username}</h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              The user will be notified and cannot access FoxVent until the ban expires.
            </p>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Duration
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      duration === opt.value
                        ? 'border-[#C0392B] bg-[#FDEDEC] text-[#C0392B]'
                        : 'border-[#E5E7EB] text-[#4B5563] hover:border-[#C0392B]/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Reason (required, min 10 chars)
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain why this user is being banned..."
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] p-2.5 text-sm outline-none focus:border-[#F36D21]"
              />
              {reason.trim().length > 0 && reason.trim().length < 10 && (
                <p className="mt-1 text-xs text-[#C0392B]">
                  At least 10 characters required.
                </p>
              )}
              {banError && (
                <p className="mt-1 text-xs text-[#C0392B]">{banError}</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setBanOpen(false)
                  setReason('')
                }}
                className="rounded-lg px-3 py-2 text-sm text-[#6B7280] hover:bg-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={isPending || reason.trim().length < 10}
                className="rounded-lg bg-[#C0392B] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? 'Banning…' : 'Ban user'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
