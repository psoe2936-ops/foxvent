import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminConversationThread } from '@/components/support/admin-conversation-thread'

type Props = { params: Promise<{ id: string }> }

export default async function AdminConversationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user: admin },
  } = await supabase.auth.getUser()

  if (!admin) notFound()

  const { data: conversation } = await supabase
    .from('support_conversations')
    .select('id, status, user_id, users(id, full_name, username, avatar_url)')
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  const { data: messages } = await supabase
    .from('support_messages')
    .select('id, sender_id, is_admin, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  // Mark all unread user messages as read on open
  await supabase
    .from('support_messages')
    .update({ is_read: true })
    .eq('conversation_id', id)
    .eq('is_admin', false)
    .eq('is_read', false)

  const user = Array.isArray(conversation.users) ? conversation.users[0] : conversation.users

  return (
    <AdminConversationThread
      conversationId={id}
      status={conversation.status as 'open' | 'closed'}
      adminId={admin.id}
      targetUser={user ?? null}
      initialMessages={messages ?? []}
    />
  )
}
