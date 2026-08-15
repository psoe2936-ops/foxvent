'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { formatShortTime } from '@/lib/format-relative-time'

type ConversationItem = {
  id: string
  otherPerson: { id: string; full_name: string; avatar_url: string | null }
  productTitle: string
  lastMessage: string
  lastMessageAt: string
  hasUnread: boolean
}

export function MessagesPanel({ userId }: { userId: string }) {
  const t = useTranslations('chat')
  const tSidebar = useTranslations('sidebar')
  const tNotif = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
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

  // Always-live unread count — drives the badge even when the panel is closed.
  // Counts distinct conversations that have at least one unread message from someone else.
  useEffect(() => {
    async function fetchUnreadCount() {
      const { data: myConvos } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

      if (!myConvos || myConvos.length === 0) {
        setUnreadCount(0)
        return
      }

      const ids = myConvos.map((c: { id: string }) => c.id)

      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', ids)
        .neq('sender_id', userId)
        .eq('is_read', false)

      const unique = new Set(
        (unreadMsgs ?? []).map((m: { conversation_id: string }) => m.conversation_id),
      )
      setUnreadCount(unique.size)
    }

    fetchUnreadCount()

    // Unique name per invocation avoids Supabase error when React Strict Mode
    // runs the effect twice before the previous channel is fully removed.
    const channel = supabase
      .channel(`messages-panel-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadCount()
          setRefreshTick((t) => t + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Fetch conversations + last messages when panel opens or realtime fires while open
  useEffect(() => {
    if (!open) return
    let active = true

    async function load() {
      setLoading(true)

      const { data: convos } = await supabase
        .from('conversations')
        .select(
          `id, last_message_at, buyer_id, seller_id,
           products(id, title),
           buyer:buyer_id(id, full_name, avatar_url),
           seller:seller_id(id, full_name, avatar_url)`,
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .limit(8)

      if (!active) return

      if (!convos || convos.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      const ids = (convos as any[]).map((c) => c.id)

      const { data: msgs } = await supabase
        .from('messages')
        .select('conversation_id, content, sender_id, is_read, created_at')
        .in('conversation_id', ids)
        .order('created_at', { ascending: false })

      if (!active) return

      // One pass: build latest-message map and unread flag per conversation
      const latestMsg = new Map<string, string>()
      const hasUnreadMap = new Map<string, boolean>()

      for (const msg of (msgs as any[]) ?? []) {
        if (!latestMsg.has(msg.conversation_id)) {
          latestMsg.set(msg.conversation_id, msg.content)
        }
        if (msg.sender_id !== userId && !msg.is_read) {
          hasUnreadMap.set(msg.conversation_id, true)
        }
      }

      const result: ConversationItem[] = (convos as any[]).map((convo) => {
        const buyer = Array.isArray(convo.buyer) ? convo.buyer[0] : convo.buyer
        const seller = Array.isArray(convo.seller) ? convo.seller[0] : convo.seller
        const product = Array.isArray(convo.products) ? convo.products[0] : convo.products
        const other = convo.buyer_id === userId ? seller : buyer

        return {
          id: convo.id,
          otherPerson: other ?? { id: '', full_name: t('unknownUser'), avatar_url: null },
          productTitle: product?.title ?? '',
          lastMessage: latestMsg.get(convo.id) ?? '',
          lastMessageAt: convo.last_message_at,
          hasUnread: hasUnreadMap.get(convo.id) ?? false,
        }
      })

      setItems(result)
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, refreshTick])

  const displayed = search.trim()
    ? items.filter(
        (item) =>
          item.otherPerson.full_name.toLowerCase().includes(search.toLowerCase()) ||
          item.productTitle.toLowerCase().includes(search.toLowerCase()),
      )
    : items

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={`${tSidebar('messages')}${unreadCount > 0 ? `, ${tNotif('unreadCount', { count: unreadCount })}` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-85">
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="shrink-0 text-[15px] font-bold text-[#1F2937]">{tSidebar('messages')}</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchMessagesPlaceholder')}
              className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#374151] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21]"
            />
          </div>

          {/* List */}
          <div className="max-h-105 min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="size-5 animate-spin rounded-full border-2 border-[#F36D21] border-t-transparent" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle className="mx-auto size-8 text-[#D1D5DB]" />
                <p className="mt-3 text-sm font-medium text-[#374151]">
                  {search ? t('noResultsFound') : t('noMessagesYetPanel')}
                </p>
                {!search && (
                  <p className="mt-1 text-xs text-[#9CA3AF]">
                    {t('startConversationByContacting')}
                  </p>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {displayed.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        router.push(`/chat/${item.id}`)
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F9FAFB] ${
                        item.hasUnread ? 'bg-[#FEF3E2]' : ''
                      }`}
                    >
                      {item.otherPerson.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.otherPerson.avatar_url}
                          alt=""
                          className="size-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-sm font-semibold text-[#6B7280]">
                          {item.otherPerson.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-sm ${
                              item.hasUnread
                                ? 'font-semibold text-[#1F2937]'
                                : 'font-medium text-[#374151]'
                            }`}
                          >
                            {item.otherPerson.full_name}
                          </span>
                          <span className="shrink-0 text-[11px] text-[#9CA3AF]">
                            {formatShortTime(item.lastMessageAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-[#9CA3AF]">{item.productTitle}</p>
                        {item.lastMessage && (
                          <p
                            className={`mt-0.5 truncate text-xs ${
                              item.hasUnread ? 'font-medium text-[#4B5563]' : 'text-[#9CA3AF]'
                            }`}
                          >
                            {item.lastMessage}
                          </p>
                        )}
                      </div>

                      {item.hasUnread && (
                        <div className="mt-2 size-2 shrink-0 rounded-full bg-[#F36D21]" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#E5E7EB] px-4 py-2.5">
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[#F36D21] hover:underline"
            >
              {t('viewAllConversations')} →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
