'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, Bell, CheckCircle2, MessageCircle, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/format-relative-time'

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

export function NotificationsList({
  userId,
  initialNotifications,
}: {
  userId: string
  initialNotifications: NotificationRow[]
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [markingAll, setMarkingAll] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function markAllRead() {
    setMarkingAll(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setMarkingAll(false)
    router.refresh()
  }

  async function handleClick(n: NotificationRow) {
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)),
      )
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    }
    router.push(n.link)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1F2937]">Notifications</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#6B7280]">
            {unreadCount > 0 ? `${unreadCount} unread` : `${notifications.length} total`}
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll}
              className="cursor-pointer text-sm text-[#F36D21] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? 'Marking…' : 'Mark all as read'}
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
          <Image src="/fox-curious.png" alt="" width={120} height={120} className="mx-auto mb-4" />
          <p className="text-base font-medium text-[#1F2937]">No notifications yet</p>
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
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
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
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
