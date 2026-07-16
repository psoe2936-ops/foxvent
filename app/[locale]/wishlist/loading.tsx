import { ProductCardSkeleton } from '@/components/feed/product-card-skeleton'

export default function WishlistLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="h-7 w-36 animate-pulse rounded-md bg-[#F3F4F6]" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
