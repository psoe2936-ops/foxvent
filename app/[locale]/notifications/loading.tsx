import { Skeleton } from '@/components/ui/skeleton'

function NotificationRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:px-6">
      <Skeleton className="mt-0.5 size-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="mt-1 h-3 w-16 shrink-0" />
    </div>
  )
}

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Skeleton className="mb-6 h-7 w-36" />
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="divide-y divide-[#F3F4F6]">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
