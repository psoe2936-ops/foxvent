'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarRatingInput } from '@/components/reviews/star-rating-input'

export function ReviewModal({
  sellerId,
  sellerName,
  productId,
  productTitle,
  onClose,
  onSuccess,
}: {
  sellerId: string
  sellerName: string
  productId?: string
  productTitle?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (rating === 0 || submitting) return
    setSubmitting(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to leave a review.')
      setSubmitting(false)
      return
    }

    const { error: dbErr } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      seller_id: sellerId,
      product_id: productId ?? null,
      rating,
      comment: comment.trim() || null,
    })

    setSubmitting(false)

    if (dbErr) {
      if (dbErr.code === '23505') {
        setError("You've already reviewed this transaction.")
      } else {
        setError('Failed to submit review. Please try again.')
      }
      return
    }

    setDone(true)
    setTimeout(() => {
      onSuccess()
      onClose()
    }, 1200)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/60 bg-white/90 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[#1F2937]">
              Rate your experience with {sellerName}
            </h2>
            {productTitle && (
              <p className="mt-0.5 text-xs text-[#9CA3AF]">for {productTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {done ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
            <span className="text-3xl">🙏</span>
            <p className="font-medium text-[#1F2937]">Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex justify-center">
              <StarRatingInput value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#374151]">
                Comment{' '}
                <span className="text-[#9CA3AF]">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Share your experience..."
                className="w-full resize-none rounded-lg border border-[#E5E7EB] p-3 text-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21]"
              />
              <p className="mt-0.5 text-right text-xs text-[#9CA3AF]">{comment.length}/500</p>
            </div>

            {error && (
              <p className="rounded-lg bg-[#FDEDEC] px-3 py-2 text-xs text-[#C0392B]">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
