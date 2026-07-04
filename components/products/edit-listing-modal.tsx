'use client'

import { useRef, useState, useTransition, type ChangeEvent } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProduct } from '@/app/products/actions'
import type { Category } from '@/components/profile/new-listing-modal'

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New with tags' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

type EditableProduct = {
  id: string
  title: string
  description: string | null
  price: number
  condition: string
  category_id: string | null
  location: string | null
  status: string
}

type Props = {
  product: EditableProduct
  categories: Category[]
  sellerUsername: string
  onClose: () => void
  onSuccess?: () => void
}

export function EditListingModal({ product, categories, sellerUsername, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description ?? '')
  const [price, setPrice] = useState(String(product.price))
  const [condition, setCondition] = useState(product.condition)
  const [categoryId, setCategoryId] = useState(product.category_id ?? '')
  const [location, setLocation] = useState(product.location ?? '')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [isPending, startTransition] = useTransition()
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Editing an approved or rejected listing resets it to pending
  const willResubmit = product.status === 'approved' || product.status === 'rejected'

  function handleClose() {
    if (isPending) return
    onClose()
  }

  function showToast() {
    setToast(true)
    toastTimer.current = setTimeout(() => setToast(false), 3000)
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (isPending) return

    if (!title.trim()) { setError('Title is required.'); return }
    if (!categoryId) { setError('Please select a category.'); return }
    if (!condition) { setError('Please select a condition.'); return }
    const numPrice = Number(price)
    if (!price || isNaN(numPrice) || numPrice <= 0) { setError('Enter a valid price.'); return }

    setError(null)
    const fd = new FormData()
    fd.set('productId', product.id)
    fd.set('sellerUsername', sellerUsername)
    fd.set('title', title)
    fd.set('description', description)
    fd.set('price', price)
    fd.set('condition', condition)
    fd.set('category_id', categoryId)
    fd.set('location', location)

    startTransition(async () => {
      try {
        await updateProduct(fd)
        showToast()
        onSuccess?.()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 sm:p-4"
        onClick={handleClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
            <h2 className="text-lg font-bold text-[#2D2E32]">Edit listing</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              aria-label="Close"
              className="text-[#9CA3AF] transition-colors hover:text-[#2D2E32] disabled:opacity-50"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {willResubmit && (
              <div className="mb-4 rounded-lg bg-[#FEF3E2] px-4 py-3 text-sm text-[#C26A08]">
                {product.status === 'approved'
                  ? 'Saving changes will put this listing back in pending review.'
                  : 'Saving changes will resubmit this listing for review.'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">Title</label>
                <input
                  type="text"
                  value={title}
                  maxLength={100}
                  disabled={isPending}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F36D21] disabled:opacity-60"
                />
                <div className="mt-0.5 text-right text-xs text-[#9CA3AF]">{title.length}/100</div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">Description</label>
                <textarea
                  value={description}
                  maxLength={1000}
                  rows={4}
                  disabled={isPending}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#2D2E32]">Category</label>
                  <select
                    value={categoryId}
                    disabled={isPending}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F36D21] disabled:opacity-60"
                  >
                    <option value="">Select</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#2D2E32]">Condition</label>
                  <select
                    value={condition}
                    disabled={isPending}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setCondition(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F36D21] disabled:opacity-60"
                  >
                    <option value="">Select</option>
                    {CONDITION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">Price</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#6B7280]">
                    MMK
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={price}
                    disabled={isPending}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E7EB] py-2 pl-14 pr-3 text-sm outline-none focus:border-[#F36D21] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#2D2E32]">Location</label>
                <input
                  type="text"
                  value={location}
                  disabled={isPending}
                  placeholder="e.g. Yangon, Mandalay"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] disabled:opacity-60"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-[#FDEDEC] px-3 py-2 text-xs text-[#C0392B]">{error}</div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className={cn(
                  'w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors',
                  'bg-[#F36D21] hover:bg-[#E0631D] disabled:opacity-70'
                )}
              >
                {isPending ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Save changes'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-[#1F9254] px-4 py-3 text-sm font-medium text-white shadow-lg">
          Listing updated
        </div>
      )}
    </>
  )
}
