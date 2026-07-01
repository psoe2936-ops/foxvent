import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatInboxContent } from '@/components/chat/chat-inbox-content'

export default async function FeedMessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1&next=/feed/messages')

  return <ChatInboxContent userId={user.id} />
}
