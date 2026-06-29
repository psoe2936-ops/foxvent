'use client'

import { cn } from '@/lib/utils'
import { MessagesPanel } from '@/components/messages/messages-panel'
import { NotificationsPanel } from '@/components/notifications/notifications-panel'

type UtilityIconsProps = {
  userId: string
  className?: string
}

export function UtilityIcons({ userId, className }: UtilityIconsProps) {
  return (
    <div className={cn('flex items-center gap-0.5 sm:gap-1', className)}>
      <MessagesPanel userId={userId} />
      <NotificationsPanel userId={userId} />
    </div>
  )
}
