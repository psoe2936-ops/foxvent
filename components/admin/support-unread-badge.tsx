'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SupportUnreadBadge() {
  const [count, setCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchCount() {
      const { count: c } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', false)
        .eq('is_read', false)

      setCount(c ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel('support-admin-unread')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_messages' },
        () => { fetchCount() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (count === 0) return null

  return (
    <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}
