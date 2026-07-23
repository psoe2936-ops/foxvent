import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AlertTriangle, Bell, CheckCircle2, Lock, MessageCircle, UserPlus } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { NotificationItem } from '@/components/notifications/notification-item'

export type ActivityNotification = {
  id: string
  type: 'product_approved' | 'product_rejected' | 'new_message' | 'new_follower' | string
  title: string
  link: string
  is_read: boolean
  created_at: string
}

const FALLBACK_CONFIG = {
  Icon: Bell,
  colorClass: 'text-[#6B7280] bg-[#F3F4F6]',
}

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; colorClass: string }> = {
  product_approved: {
    Icon: CheckCircle2,
    colorClass: 'text-emerald-600 bg-emerald-50',
  },
  product_rejected: {
    Icon: AlertTriangle,
    colorClass: 'text-amber-600 bg-amber-50',
  },
  new_message: {
    Icon: MessageCircle,
    colorClass: 'text-blue-600 bg-blue-50',
  },
  new_follower: {
    Icon: UserPlus,
    colorClass: 'text-[#F36D21] bg-[#FEF3E2]',
  },
}

export async function ActivityPanel({
  notifications,
  isLoggedIn,
}: {
  notifications: ActivityNotification[]
  isLoggedIn: boolean
}) {
  const t = await getTranslations('feed')
  const tNotif = await getTranslations('notifications')

  return (
    <section className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-[#1F2937]">
        {t('recentActivity')}
      </h2>

      {!isLoggedIn ? (
        <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
          <Lock className="size-5 text-[#D1D5DB]" />
          <p className="text-[13px] text-[#9CA3AF]">
            Sign in to see your activity
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#9CA3AF]">
          {tNotif('allCaughtUp')}
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-0.5">
            {notifications.map((n) => {
              const { Icon, colorClass } = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG
              return (
                <li key={n.id}>
                  <NotificationItem
                    id={n.id}
                    link={n.link}
                    isRead={n.is_read}
                    className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                  >
                    <span
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <Icon className="size-3.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-[#374151]">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="mt-2 size-1.5 shrink-0 rounded-full bg-[#F36D21]" />
                    )}
                  </NotificationItem>
                </li>
              )
            })}
          </ul>
          <Link
            href="/feed/notifications"
            className="mt-3 block text-center text-[12px] font-medium text-[#F36D21] hover:underline"
          >
            View all activity
          </Link>
        </>
      )}
    </section>
  )
}