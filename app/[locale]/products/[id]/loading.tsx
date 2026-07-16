import { Skeleton } from '@/components/ui/skeleton'

export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-28" />

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="mt-4 h-3 w-40" />
          <Skeleton className="h-[76px] w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </main>
  )
}
