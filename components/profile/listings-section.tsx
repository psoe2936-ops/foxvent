'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { ProductGrid } from '@/components/profile/product-grid'
import { NewListingModal, type Category } from '@/components/profile/new-listing-modal'
import type { Product } from '@/components/profile/product-card'

type ListingsSectionProps = {
  userId: string
  categories: Category[]
  initialProducts: Product[]
  isOwner: boolean
  sellerUsername?: string
  initialModalOpen?: boolean
}

export function ListingsSection({
  userId,
  categories,
  initialProducts,
  isOwner,
  sellerUsername = '',
  initialModalOpen = false,
}: ListingsSectionProps) {
  const [products, setProducts] = useState(initialProducts)
  const [modalOpen, setModalOpen] = useState(initialModalOpen)
  const pathname = usePathname()
  const router = useRouter()

  // Clean ?new=1 from the URL once the modal has auto-opened
  useEffect(() => {
    if (initialModalOpen) {
      router.replace(pathname, { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {isOwner && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E0631D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
          >
            <Plus className="size-4" aria-hidden="true" />
            New listing
          </button>
        </div>
      )}

      <ProductGrid
        products={products}
        isOwner={isOwner}
        categories={categories}
        sellerUsername={sellerUsername}
      />

      {isOwner && (
        <NewListingModal
          userId={userId}
          categories={categories}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={(product) => setProducts((prev) => [product, ...prev])}
        />
      )}
    </div>
  )
}
