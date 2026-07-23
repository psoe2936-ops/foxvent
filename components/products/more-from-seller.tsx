import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Props = {
  sellerId: string
  sellerUsername: string
  currentProductId: string
}

export async function MoreFromSeller({ sellerId, sellerUsername, currentProductId }: Props) {
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from('products')
    .select('id, title, price, images')
    .eq('seller_id', sellerId)
    .eq('status', 'approved')
    .eq('is_sold', false)
    .neq('id', currentProductId)
    .order('created_at', { ascending: false })
    .limit(4)

  if (!listings || listings.length === 0) return null

  return (
    <section className="rounded-xl border border-[#E8EAED] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1F2937]">More from seller</h2>
        <Link
          href={`/profile/${sellerUsername}`}
          className="text-xs font-medium text-[#F36D21] hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-2">
        {listings.map((item: { id: string; title: string; price: number; images: string[] | null }) => (
          <Link
            key={item.id}
            href={`/products/${item.id}`}
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-[#F9FAFB]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.images?.[0] ?? ''}
              alt={item.title}
              className="size-12 shrink-0 rounded-lg bg-[#F3F4F6] object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#374151]">{item.title}</p>
              <p className="text-xs font-semibold text-[#F36D21]">
                MMK {item.price.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
