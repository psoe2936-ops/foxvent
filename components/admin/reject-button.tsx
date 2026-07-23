'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { rejectProduct } from '@/app/admin/products/actions'

export function RejectButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReject = async () => {
    if (!reason.trim()) return
    setLoading(true)
    await rejectProduct(productId, reason)
    setLoading(false)
    setOpen(false)
    setReason('')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#C0392B] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Reject
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5"
          >
            <h3 className="font-semibold text-[#2D2E32]">Reject listing</h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Tell the seller why this listing was rejected.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Photos are unclear, please resubmit with better lighting."
              className="mt-3 w-full rounded-lg border border-[#E5E7EB] p-2 text-sm outline-none focus:border-[#F36D21]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-[#6B7280] hover:bg-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !reason.trim()}
                className="rounded-lg bg-[#C0392B] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}