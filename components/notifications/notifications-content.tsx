import { createClient } from '@/lib/supabase/server'
import { NotificationsList } from '@/components/notifications/notifications-list'

type NotificationRow = {
  id: string
  type: 'product_approved' | 'product_rejected' | 'new_message' | 'new_follower' | string
  title: string
  body: string
  link: string
  is_read: boolean
  created_at: string
}

export async function NotificationsContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const notifications = (data as NotificationRow[]) ?? []

  return <NotificationsList userId={userId} initialNotifications={notifications} />
}
