import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsContent } from '@/components/notifications/notifications-content'

export default async function FeedNotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1&next=/feed/notifications')

  return <NotificationsContent userId={user.id} />
}
