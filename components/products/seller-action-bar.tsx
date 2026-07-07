'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { deleteProduct, markAsSold, markAsUnsold } from '@/app/products/actions'
import { EditListingModal } from '@/components/products/edit-listing-modal'
import type { Category } from '@/components/profile/new-listing-modal'
import { useToast } from '@/components/ui/toast'

type ProductData = {
  id: string
  title: string
  description: string | null
  price: number
  condition: string
  category_id: string | null
  location: string | null
  status: string
  is_sold: boolean
}

type Props = {
  product: ProductData
  categories: Category[]
  sellerUsername: string
}

export function SellerActionBar({ product, categories, sellerUsername }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  const isApproved = product.status === 'approved'

  function handleSoldToggle() {
    setError(null)
    startTransition(async () => {
      try {
        if (product.is_sold) {
          await markAsUnsold(product.id)
        } else {
          await markAsSold(product.id)
        }
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(msg)
        showToast(msg, 'error')
      }
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteProduct(product.id, sellerUsername)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(msg)
        showToast(msg, 'error')
      }
    })
  }

  return (
    <>
      <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit — available for all statuses */}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6]"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>

          {/* Mark as sold — only for approved listings */}
          {isApproved && (
            <button
              type="button"
              onClick={handleSoldToggle}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] disabled:opacity-60"
            >
              <CheckCircle className="size-3.5" />
              {product.is_sold ? 'Mark available' : 'Mark as sold'}
            </button>
          )}

          {/* Delete — with inline confirmation */}
          <div className="ml-auto flex items-center gap-2">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#FDEDEC] bg-white px-3 py-1.5 text-sm font-medium text-[#C0392B] transition-colors hover:bg-[#FDEDEC]"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            ) : (
              <>
                <span className="text-xs text-[#6B7280]">Are you sure?</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg bg-[#C0392B] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {isPending ? 'Deleting…' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-[#C0392B]">{error}</p>
        )}
      </div>

      {editOpen && (
        <EditListingModal
          product={product}
          categories={categories}
          sellerUsername={sellerUsername}
          onClose={() => setEditOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
