'use client'

import { useTranslations } from 'next-intl'
import { ProductCard, type Product } from '@/components/profile/product-card'
import { ProductOwnerMenu } from '@/components/products/product-owner-menu'
import type { Category } from '@/components/profile/new-listing-modal'

type ProductGridProps = {
  products: Product[]
  isOwner: boolean
  categories?: Category[]
  sellerUsername?: string
}

export function ProductGrid({ products, isOwner, categories = [], sellerUsername = '' }: ProductGridProps) {
  const t = useTranslations('profile')
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-10 text-center">
        <p className="text-sm font-medium text-[#2D2E32]">{t('noListingsYet')}</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          {isOwner
            ? t('itemsWillShowHere')
            : t('userHasNotListedYet')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} className="relative">
          <ProductCard product={product} />
          {isOwner && (
            <ProductOwnerMenu
              product={{
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
                condition: product.condition ?? '',
                category_id: product.category_id,
                location: product.location,
                status: product.status,
                is_sold: product.is_sold,
              }}
              categories={categories}
              sellerUsername={sellerUsername}
            />
          )}
        </div>
      ))}
    </div>
  )
}
