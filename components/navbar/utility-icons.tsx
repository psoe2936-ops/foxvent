import { Bell, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type UtilityIconsProps = {
  notificationCount?: number
  className?: string
}

export function UtilityIcons({
  notificationCount = 3,
  className,
}: UtilityIconsProps) {
  return (
    <div className={cn('flex items-center gap-0.5 sm:gap-1', className)}>
      <button
        type="button"
        aria-label="Messages"
        className="inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label={`Notifications, ${notificationCount} unread`}
        className="relative inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
      >
        <Bell className="size-5" aria-hidden="true" />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-semibold text-white">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
    </div>
  )
}
