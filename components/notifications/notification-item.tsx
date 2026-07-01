'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationItem({
  id,
  link,
  isRead,
  className,
  children,
}: {
  id: string
  link: string
  isRead: boolean
  className: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  async function handleClick() {
    if (!isRead) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    }
    router.push(link)
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
