import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function ChatInboxContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select(
      `id, last_message_at,
       products(id, title, images, price),
       buyer:buyer_id(id, username, full_name, avatar_url),
       seller:seller_id(id, username, full_name, avatar_url)`
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2937]">Messages</h1>

      <div className="mt-6 space-y-2">
        {!conversations || conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
            <p className="text-base font-medium text-[#1F2937]">No conversations yet</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Message a seller from any listing to start chatting.
            </p>
            <Link
              href="/feed"
              className="mt-5 inline-block rounded-lg bg-[#F36D21] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          conversations.map((conv: any) => {
            const product = Array.isArray(conv.products) ? conv.products[0] : conv.products
            const buyer = Array.isArray(conv.buyer) ? conv.buyer[0] : conv.buyer
            const seller = Array.isArray(conv.seller) ? conv.seller[0] : conv.seller
            const otherPerson = buyer?.id === userId ? seller : buyer

            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 hover:bg-[#F9FAFB]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={otherPerson?.avatar_url ?? ''}
                  alt=""
                  className="size-12 shrink-0 rounded-full bg-[#F3F4F6] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1F2937]">{otherPerson?.full_name}</p>
                  <p className="truncate text-sm text-[#6B7280]">
                    {product?.title} · MMK {product?.price?.toLocaleString()}
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product?.images?.[0] ?? ''}
                  alt=""
                  className="size-12 shrink-0 rounded-lg bg-[#F3F4F6] object-cover"
                />
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
