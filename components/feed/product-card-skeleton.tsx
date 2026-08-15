import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8EAED] bg-white">
      <Skeleton className="aspect-[5/4] w-full rounded-none" />
      <div className="p-3 sm:p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-3/4" />
        <Skeleton className="mt-2 h-5 w-1/2" />
        <Skeleton className="mt-1 h-3 w-2/3" />
        <div className="mt-3 flex items-center gap-2 border-t border-[#F3F4F6] pt-3">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}
