import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatThread } from '@/components/chat/chat-thread'
import { FeedSidebar } from '@/components/feed/sidebar'

type ChatPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ call?: string; offer?: string }>
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params
  const { call: callParam, offer: offerParam } = await searchParams
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

  const isBuyer = conversation.buyer_id === user.id

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

  const [
    { data: initialMessages },
    { data: initialOffers },
    { data: blockRow },
    { data: reverseBlockRow },
    { data: reviewRow },
  ] = await Promise.all([
    supabase
      .from('messages')
      .select('id, sender_id, content, created_at, is_read, message_type, call_duration_seconds, call_status')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('offers')
      .select('id, product_id, conversation_id, buyer_id, seller_id, amount, status, parent_offer_id, created_at, responded_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
    otherPerson
      ? supabase.from('blocks').select('id').eq('blocker_id', user.id).eq('blocked_id', otherPerson.id).maybeSingle()
      : Promise.resolve({ data: null }),
    otherPerson
      ? supabase.from('blocks').select('id').eq('blocker_id', otherPerson.id).eq('blocked_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    isBuyer && product?.id
      ? supabase.from('reviews').select('id').eq('reviewer_id', user.id).eq('product_id', product.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div className="w-full py-4 pb-24 lg:py-6 lg:pb-10">
      <div className="flex w-full items-start">
        <FeedSidebar userId={user.id} />

        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-10">
          <ChatThread
            conversationId={id}
            currentUserId={user.id}
            currentUserFullName={currentUserProfile?.full_name ?? ''}
            currentUserAvatar={currentUserProfile?.avatar_url ?? null}
            otherPerson={otherPerson}
            product={product}
            initialMessages={initialMessages ?? []}
            initialOffers={initialOffers ?? []}
            isBuyer={isBuyer}
            hasReviewed={!!reviewRow}
            showOfferOnMount={offerParam === '1'}
            iBlockedThem={!!blockRow}
            theyBlockedMe={!!reverseBlockRow}
            autoAccept={callParam === 'accept'}
          />
        </div>

        <aside className="scrollbar-none sticky top-20 hidden h-[calc(100vh-5rem)] w-75 shrink-0 flex-col overflow-y-auto border-l border-[#E8EAED] bg-[#F9FAFB] py-6 pl-4 pr-5 xl:flex xl:pr-6">
          {product ? (
            <section className="rounded-xl border border-[#E8EAED] bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[#1F2937]">About this listing</h2>
              {product.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="mt-3 aspect-square w-full rounded-lg object-cover"
                />
              )}
              <p className="mt-3 line-clamp-2 text-sm font-medium text-[#2D2E32]">
                {product.title}
              </p>
              <p className="mt-1 text-lg font-bold text-[#F36D21]">
                MMK {product.price.toLocaleString()}
              </p>
              <Link
                href={`/products/${product.id}`}
                className="mt-3 block w-full rounded-lg border border-[#F36D21] px-4 py-2 text-center text-xs font-semibold text-[#F36D21] hover:bg-[#FEF3E2]"
              >
                View full listing
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
