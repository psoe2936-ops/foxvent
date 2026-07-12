'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Bell, CheckCircle2, MessageCircle, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatShortTime } from '@/lib/format-relative-time'

type NotificationRow = {
  id: string
  type: 'product_approved' | 'product_rejected' | 'new_message' | 'new_follower'
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<
  NotificationRow['type'],
  { Icon: React.ElementType; iconClass: string }
> = {
  product_approved: {
    Icon: CheckCircle2,
    iconClass: 'text-emerald-600 bg-emerald-50',
  },
  product_rejected: {
    Icon: AlertCircle,
    iconClass: 'text-amber-600 bg-amber-50',
  },
  new_message: {
    Icon: MessageCircle,
    iconClass: 'text-blue-600 bg-blue-50',
  },
  new_follower: {
    Icon: UserPlus,
    iconClass: 'text-[#F36D21] bg-[#FEF3E2]',
  },
}

function isToday(dateString: string): boolean {
  const d = new Date(dateString)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function NotificationsPanel({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [refreshTick, setRefreshTick] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Close on outside click — same pattern as profile-block.tsx
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Always-live: fetch unread count on mount + keep updated via realtime.
  // This drives the badge on the bell icon even when the panel is closed.
  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      setUnreadCount(count ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`notifications-count-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCount()
          setRefreshTick((t) => t + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Fetch full list when panel opens or a realtime event fires while open
  useEffect(() => {
    if (!open) return
    let active = true

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (active) {
        const rows = (data as NotificationRow[]) ?? []
        setNotifications(rows)
        setUnreadCount(rows.filter((n) => !n.is_read).length)
        setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, refreshTick])

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function handleClick(n: NotificationRow) {
    setOpen(false)
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    router.push(n.link)
  }

  const todayItems = notifications.filter((n) => isToday(n.created_at))
  const earlierItems = notifications.filter((n) => !isToday(n.created_at))

  function renderRow(n: NotificationRow) {
    const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.new_message
    const Icon = config.Icon
    return (
      <li key={n.id}>
        <button
          type="button"
          onClick={() => handleClick(n)}
          className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F9FAFB] ${
            !n.is_read ? 'bg-[#FEF3E2]' : ''
          }`}
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
          >
            <Icon className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm leading-snug ${
                !n.is_read ? 'font-semibold text-[#1F2937]' : 'font-medium text-[#374151]'
              }`}
            >
              {n.title}
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">{n.body}</p>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">{formatShortTime(n.created_at)}</p>
          </div>
          {!n.is_read && (
            <div className="mt-2 size-2 shrink-0 rounded-full bg-[#F36D21]" />
          )}
        </button>
      </li>
    )
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-85 overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="text-[15px] font-bold text-[#1F2937]">Notifications</h2>
            {notifications.some((n) => !n.is_read) && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-[#F36D21] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-105 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="size-5 animate-spin rounded-full border-2 border-[#F36D21] border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto size-8 text-[#D1D5DB]" />
                <p className="mt-3 text-sm font-medium text-[#374151]">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">No notifications yet.</p>
              </div>
            ) : (
              <ul>
                {todayItems.length > 0 && (
                  <>
                    <li className="border-b border-[#F3F4F6] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Today
                    </li>
                    {todayItems.map(renderRow)}
                  </>
                )}
                {earlierItems.length > 0 && (
                  <>
                    <li className="border-b border-[#F3F4F6] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Earlier
                    </li>
                    {earlierItems.map(renderRow)}
                  </>
                )}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E5E7EB] px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[#F36D21] hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
