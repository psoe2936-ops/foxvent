'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { deleteProduct, markAsSold, markAsUnsold } from '@/app/products/actions'
import { EditListingModal } from '@/components/products/edit-listing-modal'
import type { Category } from '@/components/profile/new-listing-modal'

type ProductData = {
  id: string
  title: string
  description?: string | null
  price: number
  condition: string
  category_id?: string | null
  location?: string | null
  status: string
  is_sold: boolean
}

type Props = {
  product: ProductData
  categories: Category[]
  sellerUsername: string
}

export function ProductOwnerMenu({ product, categories, sellerUsername }: Props) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSoldToggle() {
    setOpen(false)
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
    setOpen(false)
    setConfirmDelete(true)
  }

  function confirmAndDelete() {
    startTransition(async () => {
      await deleteProduct(product.id, sellerUsername)
    })
  }

  const isApproved = product.status === 'approved'

  return (
    <>
      <div ref={menuRef} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setOpen((v) => !v) }}
          className="flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Listing options"
        >
          <MoreVertical className="size-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-8 min-w-[160px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setOpen(false); setEditOpen(true) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
            >
              <Pencil className="size-3.5 text-[#9CA3AF]" />
              Edit
            </button>
            {isApproved && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleSoldToggle() }}
                disabled={isPending}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-60"
              >
                <CheckCircle className="size-3.5 text-[#9CA3AF]" />
                {product.is_sold ? 'Mark available' : 'Mark as sold'}
              </button>
            )}
            <div className="my-1 h-px bg-[#F3F4F6]" />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#C0392B] hover:bg-[#FDEDEC]"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <p className="font-semibold text-[#1F2937]">Delete listing?</p>
            <p className="mt-1 text-sm text-[#6B7280]">This cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg border border-[#E5E7EB] py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndDelete}
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#C0392B] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <EditListingModal
          product={{
            id: product.id,
            title: product.title,
            description: product.description ?? null,
            price: product.price,
            condition: product.condition,
            category_id: product.category_id ?? null,
            location: product.location ?? null,
            status: product.status,
          }}
          categories={categories}
          sellerUsername={sellerUsername}
          onClose={() => setEditOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
