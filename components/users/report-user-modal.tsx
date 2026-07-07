'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { submitUserReport } from '@/app/reports/actions'

const REASONS = [
  { value: 'scam_or_fraud', label: 'Scam or fraud' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'payment_dispute', label: 'Payment dispute' },
  { value: 'other', label: 'Other' },
]

type Props = {
  targetUserId: string
  targetUsername: string
  reporterId: string
  conversationId?: string
  onClose: () => void
}

export function ReportUserModal({
  targetUserId,
  targetUsername,
  reporterId,
  conversationId,
  onClose,
}: Props) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { setError('Please select a reason.'); return }
    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await submitUserReport({
        reportedUserId: targetUserId,
        reason,
        description: description.trim(),
        conversationId,
      })
      if ('error' in result) { setError(result.error); return }
      setSubmitted(true)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white/95 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#1F2937]">Report @{targetUsername}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#1F2937]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-[#374151]">
              Report submitted. Our team will review this within 24 hours. If this involves an
              ongoing safety concern, please also block this user.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F36D21]"
              >
                <option value="">Select a reason</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Please describe what happened, including any details about payment or meetup arrangements if relevant"
                className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21]"
              />
              <p className="mt-0.5 text-right text-xs text-[#9CA3AF]">{description.length}/2000</p>
            </div>

            {error && <p className="text-xs text-[#C0392B]">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70"
            >
              {isPending ? 'Submitting…' : 'Submit report'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
