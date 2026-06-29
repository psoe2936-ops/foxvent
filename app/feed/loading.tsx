import { ProductCardSkeleton } from '@/components/feed/product-card-skeleton'

export default function FeedLoading() {
  return (
    <div className="space-y-4">
      {/* Category pills skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
        ))}
      </div>

      {/* Header row skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-6 w-32 animate-pulse rounded-md bg-[#F3F4F6]" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-[#F3F4F6] sm:w-56" />
        </div>

        <div className="h-px w-full bg-[#E8EAED]" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
