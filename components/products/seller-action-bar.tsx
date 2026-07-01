'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { deleteProduct, markAsSold, markAsUnsold } from '@/app/products/actions'
import { EditListingModal } from '@/components/products/edit-listing-modal'
import type { Category } from '@/components/profile/new-listing-modal'

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
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSoldToggle() {
    startTransition(async () => {
      if (product.is_sold) {
        await markAsUnsold(product.id)
      } else {
        await markAsSold(product.id)
      }
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteProduct(product.id, sellerUsername)
    })
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6]"
        >
          <Pencil className="size-3.5" />
          Edit
        </button>

        <button
          type="button"
          onClick={handleSoldToggle}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F3F4F6] disabled:opacity-60"
        >
          <CheckCircle className="size-3.5" />
          {product.is_sold ? 'Mark available' : 'Mark as sold'}
        </button>

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
              <span className="text-xs text-[#6B7280]">Are you sure? This cannot be undone.</span>
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
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {editOpen && (
        <EditListingModal
          product={product}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
