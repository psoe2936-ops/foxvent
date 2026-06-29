import { AlertCircle, Bell, CheckCircle2, MessageCircle, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { NotificationItem } from '@/components/notifications/notification-item'

type NotificationRow = {
  id: string
  type: 'product_approved' | 'product_rejected' | 'new_message' | 'new_follower' | string
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
}

const FALLBACK_CONFIG = { Icon: Bell, iconClass: 'text-[#6B7280] bg-[#F3F4F6]' }

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; iconClass: string }> = {
  product_approved: { Icon: CheckCircle2, iconClass: 'text-emerald-600 bg-emerald-50' },
  product_rejected: { Icon: AlertCircle, iconClass: 'text-amber-600 bg-amber-50' },
  new_message: { Icon: MessageCircle, iconClass: 'text-blue-600 bg-blue-50' },
  new_follower: { Icon: UserPlus, iconClass: 'text-[#F36D21] bg-[#FEF3E2]' },
}

export async function NotificationsContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const notifications = (data as NotificationRow[]) ?? []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1F2937]">Notifications</h1>
        <p className="text-sm text-[#6B7280]">
          {unreadCount > 0 ? `${unreadCount} unread` : `${notifications.length} total`}
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
          <Bell className="size-10 text-[#D1D5DB]" />
          <p className="mt-4 text-base font-medium text-[#1F2937]">No notifications yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            We&apos;ll notify you when something happens.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          <ul className="divide-y divide-[#F3F4F6]">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG
              const Icon = config.Icon
              return (
                <li key={n.id}>
                  <NotificationItem
                    id={n.id}
                    link={n.link}
                    isRead={n.is_read}
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F9FAFB] ${
                      !n.is_read ? 'bg-[#FEF9F5]' : ''
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
                    >
                      <Icon className="size-[18px]" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          !n.is_read
                            ? 'font-semibold text-[#1F2937]'
                            : 'font-medium text-[#374151]'
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-sm text-[#6B7280]">{n.body}</p>
                      <p className="mt-1.5 text-xs text-[#9CA3AF]">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="mt-2 size-2 shrink-0 rounded-full bg-[#F36D21]" />
                    )}
                  </NotificationItem>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
