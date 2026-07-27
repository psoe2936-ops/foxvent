'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { submitProductReport } from '@/app/reports/actions'

export function ReportButton({
  productId,
  viewerId,
}: {
  productId: string
  viewerId: string
}) {
  const t = useTranslations('product')
  const tCommon = useTranslations('common')
  const REASONS = [
    { value: 'Spam', label: t('reasonSpam') },
    { value: 'Fake listing', label: t('reasonFakeListing') },
    { value: 'Inappropriate content', label: t('reasonInappropriateContent') },
    { value: 'Wrong price', label: t('reasonWrongPrice') },
    { value: 'Already sold', label: t('reasonAlreadySold') },
    { value: 'Other', label: t('reasonOther') },
  ]
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyReported, setAlreadyReported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!reason || submitting) return
    setSubmitting(true)
    setError(null)

    const result = await submitProductReport({
      productId,
      reason,
      description: description.trim() || null,
    })

    setSubmitting(false)

    if ('error' in result) {
      if (result.error.includes('already reported')) {
        setAlreadyReported(true)
      } else {
        setError(result.error)
      }
      return
    }

    setDone(true)
  }

  function handleClose() {
    setOpen(false)
    setReason('')
    setDescription('')
    setError(null)
    setDone(false)
    setAlreadyReported(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] transition-colors hover:text-[#6B7280]"
      >
        <Flag className="size-3.5" />
        {t('reportListing')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl bg-white/95 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label={tCommon('close')}
              className="absolute right-4 top-4 text-[#9CA3AF] hover:text-[#2D2E32]"
            >
              <X className="size-5" />
            </button>

            <h2 id="report-modal-title" className="text-base font-bold text-[#1F2937]">
              {t('reportThisListing')}
            </h2>

            {done ? (
              <div className="mt-4 text-center">
                <p className="text-sm text-[#1F2937]">
                  {t('reportSubmitted')}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  {t('done')}
                </button>
              </div>
            ) : alreadyReported ? (
              <div className="mt-4 text-center">
                <p className="text-sm text-[#6B7280]">
                  {t('alreadyReported')}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB]"
                >
                  {tCommon('close')}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                    {t('reasonLabel')}
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21]"
                  >
                    <option value="">{t('selectAReason')}</option>
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#2D2E32]">
                    {t('additionalDetails')}{' '}
                    <span className="text-[#9CA3AF]">{t('optional')}</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder={t('describeIssue')}
                    className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21]"
                  />
                  <p className="mt-0.5 text-right text-xs text-[#9CA3AF]">
                    {description.length}/500
                  </p>
                </div>

                {error && (
                  <p className="rounded-lg bg-[#FDEDEC] px-3 py-2 text-xs text-[#C0392B]">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!reason || submitting}
                  className="w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? t('submitting') : t('submitReport')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
