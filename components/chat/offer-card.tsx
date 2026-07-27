'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { respondToOffer, type Offer } from '@/app/offers/actions'

const STATUS_COLOR: Record<Offer['status'], string> = {
  pending: 'text-[#C26A08] bg-[#FEF3E2]',
  accepted: 'text-[#1A7A4A] bg-[#E8F5E9]',
  rejected: 'text-[#C0392B] bg-[#FDEDEC]',
  countered: 'text-[#6B7280] bg-[#F3F4F6]',
  expired: 'text-[#9CA3AF] bg-[#F3F4F6]',
}

export function OfferCard({
  offer,
  currentUserId,
  onUpdate,
}: {
  offer: Offer
  currentUserId: string
  onUpdate: (updated: Offer) => void
}) {
  const t = useTranslations('offer')
  const tCommon = useTranslations('common')

  const STATUS_LABEL: Record<Offer['status'], string> = {
    pending: t('statusPending'),
    accepted: t('statusAccepted'),
    rejected: t('statusRejected'),
    countered: t('statusCountered'),
    expired: t('statusExpired'),
  }

  const isCounterOffer = offer.parent_offer_id !== null

  // Who sent this offer? Use sender_id if available, 
  // fallback to buyer_id for initial offers
  const senderId = offer.sender_id ?? offer.buyer_id

  // I sent this offer if I am the sender
  const iMadethisOffer = senderId === currentUserId

  // I can respond if: I did NOT send this offer AND it's pending
  const canRespond = !iMadethisOffer && offer.status === 'pending'

  const [mode, setMode] = useState<'view' | 'counter'>('view')
  const [counterAmount, setCounterAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAction(action: 'accepted' | 'rejected' | 'countered') {
    setError(null)
    startTransition(async () => {
      const result = await respondToOffer({
        offerId: offer.id,
        action,
        counterAmount: action === 'countered' ? Number(counterAmount) : undefined,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      onUpdate({
        ...offer,
        status: action === 'countered' ? 'countered' : action,
        responded_at: new Date().toISOString(),
      })
      setMode('view')
      setCounterAmount('')
    })
  }

  return (
    <div className={`flex flex-col ${iMadethisOffer ? 'items-end' : 'items-start'} my-1`}>
      <div className="w-64 rounded-2xl border-2 border-[#F36D21] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
            {isCounterOffer ? t('counterOfferLabel') : t('offerLabel')}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[offer.status]}`}
          >
            {STATUS_LABEL[offer.status]}
          </span>
        </div>

        <p className="mt-2 text-2xl font-bold text-[#2D2E32]">
          MMK {offer.amount.toLocaleString()}
        </p>

        {/* Show who is waiting */}
        {offer.status === 'pending' && iMadethisOffer && (
          <p className="mt-2 text-xs text-[#9CA3AF]">{t('waitingForResponse')}</p>
        )}

        {/* Accept / Counter / Reject buttons for the responder */}
        {canRespond && mode === 'view' && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleAction('accepted')}
              disabled={isPending}
              className="flex-1 rounded-lg bg-[#1A7A4A] px-2 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {t('accept')}
            </button>
            <button
              type="button"
              onClick={() => setMode('counter')}
              disabled={isPending}
              className="flex-1 rounded-lg border border-[#F36D21] px-2 py-1.5 text-xs font-semibold text-[#F36D21] hover:bg-[#FEF3E2] disabled:opacity-50"
            >
              {t('counter')}
            </button>
            <button
              type="button"
              onClick={() => handleAction('rejected')}
              disabled={isPending}
              className="flex-1 rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-xs font-semibold text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-50"
            >
              {t('reject')}
            </button>
          </div>
        )}

        {/* Counter input */}
        {canRespond && mode === 'counter' && (
          <div className="mt-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7280]">
                MMK
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={counterAmount}
                onChange={(e) => {
                  setCounterAmount(e.target.value.replace(/[^0-9]/g, ''))
                  setError(null)
                }}
                placeholder={t('counterAmountPlaceholder')}
                className="w-full rounded-lg border border-[#E5E7EB] py-2 pl-12 pr-3 text-sm outline-none focus:border-[#F36D21]"
              />
            </div>
            {error && <p className="mt-1 text-xs text-[#C0392B]">{error}</p>}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => { setMode('view'); setCounterAmount(''); setError(null) }}
                disabled={isPending}
                className="flex-1 rounded-lg border border-[#E5E7EB] py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-50"
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('countered')}
                disabled={isPending || !counterAmount}
                className="flex-1 rounded-lg bg-[#F36D21] py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? '…' : t('send')}
              </button>
            </div>
          </div>
        )}

        {error && mode === 'view' && (
          <p className="mt-2 text-xs text-[#C0392B]">{error}</p>
        )}

        {/* Accepted state */}
        {offer.status === 'accepted' && (
          <p className="mt-2 text-xs font-medium text-[#1A7A4A]">
            ✓ {t('acceptedMessage')}
          </p>
        )}

        {/* Rejected state */}
        {offer.status === 'rejected' && (
          <p className="mt-2 text-xs text-[#9CA3AF]">{t('declinedMessage')}</p>
        )}
      </div>
    </div>
  )
}