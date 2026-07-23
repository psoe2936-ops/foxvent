'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SidebarUnreadBadge({
  userId,
  type,
}: {
  userId: string
  type: 'messages' | 'notifications'
}) {
  const [count, setCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchCount() {
      if (type === 'messages') {
        const { data: myConvos } = await supabase
          .from('conversations')
          .select('id')
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

        if (!myConvos || myConvos.length === 0) {
          setCount(0)
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
        setCount(unique.size)
      } else {
        const { count: c } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false)
        setCount(c ?? 0)
      }
    }

    fetchCount()

    const channel = supabase
      .channel(
        `sidebar-${type}-${userId}-${Math.random().toString(36).slice(2)}`,
      )
      .on(
        'postgres_changes',
        type === 'notifications'
          ? {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            }
          : { event: '*', schema: 'public', table: 'messages' },
        () => fetchCount(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type])

  if (count === 0) return null

  return (
    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-semibold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}
