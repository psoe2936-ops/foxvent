import Link from 'next/link'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/feed/product-card'
import { FollowButton } from '@/components/profile/follow-button'

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

async function fetchSuggestedSellers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  followedIds: string[],
  limit: number,
) {
  const { data: productRows } = await supabase
    .from('products')
    .select('seller_id')
    .eq('status', 'approved')
    .not('seller_id', 'is', null)

  const countMap = new Map<string, number>()
  for (const row of productRows ?? []) {
    if (row.seller_id === userId || followedIds.includes(row.seller_id)) continue
    countMap.set(row.seller_id, (countMap.get(row.seller_id) ?? 0) + 1)
  }

  const topIds = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  if (topIds.length === 0) return []

  const { data: users } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .in('id', topIds)

  const userMap = new Map((users ?? []).map((u: any) => [u.id, u]))
  return topIds
    .map((id) => ({ ...userMap.get(id), listing_count: countMap.get(id) ?? 0 }))
    .filter((u: any) => u.id)
}

function SuggestedSellerRow({
  seller,
  viewerId,
}: {
  seller: { id: string; username: string; full_name: string; avatar_url: string | null; listing_count: number }
  viewerId: string
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3.5">
      <Link
        href={`/profile/${seller.username}`}
        className="flex min-w-0 items-center gap-3 hover:opacity-80"
      >
        {seller.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={seller.avatar_url}
            alt=""
            className="size-10 shrink-0 rounded-full bg-[#F3F4F6] object-cover"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-sm font-semibold text-[#6B7280]">
            {(seller.full_name?.[0] ?? seller.username?.[0] ?? '?').toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#1F2937]">{seller.full_name}</p>
          <p className="truncate text-sm text-[#6B7280]">
            @{seller.username}
            {seller.listing_count > 0 && (
              <> · {seller.listing_count} listing{seller.listing_count !== 1 ? 's' : ''}</>
            )}
          </p>
        </div>
      </Link>
      <FollowButton
        targetUserId={seller.id}
        viewerId={viewerId}
        initialFollowing={false}
      />
    </li>
  )
}

export async function FollowingContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: followRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followedIds = (followRows ?? []).map((r: { following_id: string }) => r.following_id)

  let products: any[] = []
  if (followedIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select(
        'id, title, price, images, condition, is_sold, created_at, categories(id, name), users(id, username, avatar_url)'
      )
      .eq('status', 'approved')
      .in('seller_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(20)
    products = data ?? []
  }

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('product_id')
    .eq('user_id', userId)
  const savedSet = new Set((wishlist ?? []).map((w: { product_id: string }) => w.product_id))

  const suggestedLimit = followedIds.length === 0 ? 6 : 3
  const suggestedSellers = await fetchSuggestedSellers(supabase, userId, followedIds, suggestedLimit)

  // ── Empty state ──────────────────────────────────────────────────────────
  if (followedIds.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-[#1F2937]">Following</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">Listings from sellers you follow</p>

        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#FEF3E2]">
            <Users className="size-6 text-[#F36D21]" />
          </div>
          <div>
            <p className="font-semibold text-[#1F2937]">You&apos;re not following anyone yet</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              When you follow sellers, their listings appear here
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/feed"
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#1F2937] hover:bg-[#F9FAFB]"
            >
              Browse listings
            </Link>
            <Link
              href="/feed"
              className="rounded-xl bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Discover sellers
            </Link>
          </div>
        </div>

        {suggestedSellers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-[#1F2937]">Suggested sellers to follow</h2>
            <ul className="mt-3 divide-y divide-[#F3F4F6] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
              {suggestedSellers.map((seller: any) => (
                <SuggestedSellerRow key={seller.id} seller={seller} viewerId={userId} />
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // ── Non-empty state ──────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="text-xl font-bold text-[#1F2937]">Following</h1>
      <p className="mt-0.5 text-sm text-[#6B7280]">Listings from sellers you follow</p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
          <p className="font-medium text-[#1F2937]">No listings yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            The sellers you follow haven&apos;t posted anything recently.
          </p>
          <Link
            href="/feed"
            className="mt-4 inline-block text-sm font-medium text-[#F36D21] hover:underline"
          >
            Browse all listings
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3">
          {products.map((product: any) => {
            const cat = Array.isArray(product.categories)
              ? product.categories[0]
              : product.categories
            const seller = Array.isArray(product.users) ? product.users[0] : product.users
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                images={product.images}
                conditionLabel={CONDITION_LABEL[product.condition] ?? product.condition}
                conditionKey={product.condition}
                categoryName={cat?.name}
                sellerUsername={seller?.username}
                sellerAvatar={seller?.avatar_url}
                createdAt={product.created_at}
                initialSaved={savedSet.has(product.id)}
                isFollowingSeller
                isSold={product.is_sold ?? false}
              />
            )
          })}
        </div>
      )}

      {suggestedSellers.length > 0 && (
        <div className="mt-10 border-t border-[#E5E7EB] pt-8">
          <h2 className="text-base font-semibold text-[#1F2937]">Discover more sellers</h2>
          <ul className="mt-3 divide-y divide-[#F3F4F6] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            {suggestedSellers.map((seller: any) => (
              <SuggestedSellerRow key={seller.id} seller={seller} viewerId={userId} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
