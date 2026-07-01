import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatInboxContent } from '@/components/chat/chat-inbox-content'

export default async function ChatInboxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1')

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ChatInboxContent userId={user.id} />
    </main>
  )
}
