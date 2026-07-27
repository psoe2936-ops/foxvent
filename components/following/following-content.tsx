import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getConditionLabel } from '@/lib/condition-label'
import { ProductCard } from '@/components/feed/product-card'
import { FollowButton } from '@/components/profile/follow-button'

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
  t,
}: {
  seller: { id: string; username: string; full_name: string; avatar_url: string | null; listing_count: number }
  viewerId: string
  t: (key: string, values?: Record<string, string | number>) => string
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
              <> · {t('listingsCount', { count: seller.listing_count })}</>
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
  const t = await getTranslations('following')
  const tSidebar = await getTranslations('sidebar')
  const tFeed = await getTranslations('feed')
  const tProduct = await getTranslations('product')
  const tChat = await getTranslations('chat')
  const tProfile = await getTranslations('profile')
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
        <h1 className="text-xl font-bold text-[#1F2937]">{tSidebar('following')}</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">{t('listingsFromSellersYouFollow')}</p>

        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-12 text-center">
          <Image src="/fox-curious.png" alt="" width={120} height={120} className="mx-auto" />
          <div>
            <p className="font-semibold text-[#1F2937]">{t('notFollowingAnyoneYetHeading')}</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              {t('whenYouFollowSellers')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/feed"
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#1F2937] hover:bg-[#F9FAFB]"
            >
              {tChat('browseListings')}
            </Link>
            <Link
              href="/feed"
              className="rounded-xl bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {t('discoverSellers')}
            </Link>
          </div>
        </div>

        {suggestedSellers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-[#1F2937]">{t('suggestedSellersToFollow')}</h2>
            <ul className="mt-3 divide-y divide-[#F3F4F6] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
              {suggestedSellers.map((seller: any) => (
                <SuggestedSellerRow key={seller.id} seller={seller} viewerId={userId} t={tFeed} />
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
      <h1 className="text-xl font-bold text-[#1F2937]">{tSidebar('following')}</h1>
      <p className="mt-0.5 text-sm text-[#6B7280]">{t('listingsFromSellersYouFollow')}</p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
          <p className="font-medium text-[#1F2937]">{tProfile('noListingsYet')}</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {t('sellersHaventPosted')}
          </p>
          <Link
            href="/feed"
            className="mt-4 inline-block text-sm font-medium text-[#F36D21] hover:underline"
          >
            {t('browseAllListings')}
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
                conditionLabel={getConditionLabel(tProduct, product.condition)}
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
          <h2 className="text-base font-semibold text-[#1F2937]">{t('discoverMoreSellers')}</h2>
          <ul className="mt-3 divide-y divide-[#F3F4F6] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            {suggestedSellers.map((seller: any) => (
              <SuggestedSellerRow key={seller.id} seller={seller} viewerId={userId} t={tFeed} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
