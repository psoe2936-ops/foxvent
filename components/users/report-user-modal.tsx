'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { submitUserReport } from '@/app/reports/actions'

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
  const t = useTranslations('safety')
  const tCommon = useTranslations('common')
  const tProduct = useTranslations('product')
  const tListing = useTranslations('listing')
  const tChat = useTranslations('chat')
  const REASONS = [
    { value: 'scam_or_fraud', label: t('reasonScamOrFraud') },
    { value: 'harassment', label: t('reasonHarassment') },
    { value: 'fake_profile', label: t('reasonFakeProfile') },
    { value: 'inappropriate_behavior', label: t('reasonInappropriateBehavior') },
    { value: 'payment_dispute', label: t('reasonPaymentDispute') },
    { value: 'other', label: t('reasonOther') },
  ]
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { setError(t('pleaseSelectReason')); return }
    if (description.trim().length < 20) {
      setError(t('descriptionTooShort20'))
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/60 bg-white/90 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#1F2937]">{tChat('reportUser', { username: targetUsername })}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#1F2937]"
            aria-label={tCommon('close')}
          >
            <X className="size-5" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-[#374151]">
              {t('reportSubmittedExtended')}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              {tProduct('done')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">{tProduct('reasonLabel')}</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F36D21]"
              >
                <option value="">{tProduct('selectAReason')}</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">{tListing('descriptionLabel')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={t('describeWhatHappened')}
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
              {isPending ? tProduct('submitting') : tProduct('submitReport')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
