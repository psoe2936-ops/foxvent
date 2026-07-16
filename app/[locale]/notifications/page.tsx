import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsContent } from '@/components/notifications/notifications-content'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1&next=/notifications')

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <NotificationsContent userId={user.id} />
    </main>
  )
}
