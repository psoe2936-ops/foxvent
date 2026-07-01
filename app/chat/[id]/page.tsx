import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatThread } from '@/components/chat/chat-thread'

type ChatPageProps = {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?login=1')
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select(
      `id, product_id, buyer_id, seller_id,
       products(id, title, price, images),
       buyer:buyer_id(id, username, full_name, avatar_url),
       seller:seller_id(id, username, full_name, avatar_url)`
    )
    .eq('id', id)
    .single()

  if (!conversation) {
    notFound()
  }

  const isParticipant =
    conversation.buyer_id === user.id || conversation.seller_id === user.id

  if (!isParticipant) {
    redirect('/chat')
  }

  const product = Array.isArray(conversation.products)
    ? conversation.products[0]
    : conversation.products
  const buyer = Array.isArray(conversation.buyer)
    ? conversation.buyer[0]
    : conversation.buyer
  const seller = Array.isArray(conversation.seller)
    ? conversation.seller[0]
    : conversation.seller

  const otherPerson = conversation.buyer_id === user.id ? seller : buyer
  const currentUserProfile = conversation.buyer_id === user.id ? buyer : seller

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, is_read')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <ChatThread
        conversationId={id}
        currentUserId={user.id}
        currentUserFullName={currentUserProfile?.full_name ?? ''}
        currentUserAvatar={currentUserProfile?.avatar_url ?? null}
        otherPerson={otherPerson}
        product={product}
        initialMessages={initialMessages ?? []}
      />
    </main>
  )
}
