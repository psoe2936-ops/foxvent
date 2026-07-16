import { Skeleton } from '@/components/ui/skeleton'
import { ProductCardSkeleton } from '@/components/feed/product-card-skeleton'

export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          {/* Cover photo */}
          <Skeleton className="h-32 w-full rounded-none sm:h-44" />

          <div className="px-4 pb-5 sm:px-6 md:px-8">
            {/* Avatar + name row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Skeleton className="-mt-8 size-20 rounded-full ring-4 ring-white sm:-mt-10 sm:size-24" />
                <div className="space-y-2 pb-1">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 shrink-0 rounded-lg" />
            </div>

            {/* Stats row */}
            <div className="mt-5 flex items-center gap-6 border-t border-[#F3F4F6] pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1 text-center">
                  <Skeleton className="mx-auto h-5 w-8" />
                  <Skeleton className="mx-auto h-3 w-14" />
                </div>
              ))}
            </div>
          </div>

          {/* Listings grid */}
          <div className="border-t border-[#F3F4F6] p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
