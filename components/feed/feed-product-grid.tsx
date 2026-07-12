import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CategoryPills } from '@/components/feed/category-pills'
import { ProductCard } from '@/components/feed/product-card'
import { FilterPanel } from '@/components/feed/filter-panel'
import { RecentlyViewedRow } from '@/components/feed/recently-viewed-row'
import { UserCard } from '@/components/search/user-card'

type SearchParams = {
  category?: string
  q?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  condition?: string
  hideSold?: string
}

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

type SortOption = 'newest' | 'price_asc' | 'price_desc'

type RawProduct = {
  id: string
  title: string
  price: number
  images: string[] | null
  condition: string
  is_sold: boolean
  created_at: string
  seller_id: string
  categories: { id: string; name: string } | { id: string; name: string }[] | null
  users: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null
}

export async function FeedProductGrid({
  searchParams,
  basePath = '/feed',
}: {
  searchParams: SearchParams
  basePath?: string
}) {
  const { category, q, sort: sortParam, minPrice, maxPrice, condition, hideSold } = searchParams
  const sort: SortOption =
    sortParam === 'price_asc' || sortParam === 'price_desc' ? sortParam : 'newest'
  const conditionArray = condition ? condition.split(',').filter(Boolean) : []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let savedSet = new Set<string>()
  let followingSet = new Set<string>()
  if (user) {
    const [wishlistRes, followsRes] = await Promise.all([
      supabase.from('wishlists').select('product_id').eq('user_id', user.id),
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
    ])
    savedSet = new Set((wishlistRes.data ?? []).map((r: { product_id: string }) => r.product_id))
    followingSet = new Set((followsRes.data ?? []).map((r: { following_id: string }) => r.following_id))
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .order('name')

  // Real per-category listing counts (approved only) — powers the "(N)" count in each pill
  const { data: categoryCountRows } = await supabase
    .from('products')
    .select('category_id')
    .eq('status', 'approved')

  const categoryCounts: Record<string, number> = {}
  for (const row of (categoryCountRows ?? []) as { category_id: string | null }[]) {
    if (!row.category_id) continue
    categoryCounts[row.category_id] = (categoryCounts[row.category_id] ?? 0) + 1
  }
  const totalCount = (categoryCountRows ?? []).length

  // --- SEARCH MODE ---
  if (q) {
    // 1. Fetch users matching the query
    const { data: matchedUsers } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .neq('role', 'admin')
      .limit(5)

    const userIds = (matchedUsers ?? []).map((u: { id: string }) => u.id)

    // 2. Count approved listings per matched user
    const listingCountMap: Record<string, number> = {}
    if (userIds.length > 0) {
      const { data: sellerListings } = await supabase
        .from('products')
        .select('seller_id')
        .eq('status', 'approved')
        .in('seller_id', userIds)
      for (const { seller_id } of (sellerListings ?? []) as { seller_id: string }[]) {
        listingCountMap[seller_id] = (listingCountMap[seller_id] ?? 0) + 1
      }
    }

    // 3. Products matching title/description OR sold by a matching seller
    let productQuery = supabase
      .from('products')
      .select(
        'id, title, price, images, condition, is_sold, created_at, seller_id, categories(id, name), users(username, avatar_url)'
      )
      .eq('status', 'approved')
      .order('is_sold', { ascending: true })
      .order('created_at', { ascending: false })

    const orFilter =
      userIds.length > 0
        ? `title.ilike.%${q}%,description.ilike.%${q}%,seller_id.in.(${userIds.join(',')})`
        : `title.ilike.%${q}%,description.ilike.%${q}%`

    productQuery = productQuery.or(orFilter)

    const { data: searchProducts } = await productQuery

    const people = (matchedUsers ?? []) as {
      id: string
      username: string
      full_name: string | null
      avatar_url: string | null
    }[]
    const listings = (searchProducts ?? []) as RawProduct[]

    return (
      <div className="space-y-6">
        <CategoryPills
          categories={categories ?? []}
          activeCategory={undefined}
          filterParams={{ q, sort: 'newest' }}
          basePath={basePath}
          categoryCounts={categoryCounts}
          totalCount={totalCount}
        />

        {/* Summary bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6B7280]">
              Results for{' '}
              <span className="font-semibold text-[#1F2937]">&ldquo;{q}&rdquo;</span>
            </p>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              {people.length} {people.length === 1 ? 'person' : 'people'} &middot; {listings.length}{' '}
              {listings.length === 1 ? 'listing' : 'listings'}
            </p>
          </div>
          <Link
            href={basePath}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280]"
          >
            <X className="size-3" />
            Clear
          </Link>
        </div>

        {/* People section — hidden when no matches */}
        {people.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#1F2937]">
              People{' '}
              <span className="font-normal text-[#9CA3AF]">({people.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {people.map((u) => (
                <UserCard
                  key={u.id}
                  id={u.id}
                  username={u.username}
                  fullName={u.full_name}
                  avatarUrl={u.avatar_url}
                  listingCount={listingCountMap[u.id] ?? 0}
                  isFollowing={followingSet.has(u.id)}
                  viewerId={user?.id ?? null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Listings section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1F2937]">
            Listings{' '}
            <span className="font-normal text-[#9CA3AF]">({listings.length})</span>
          </h2>

          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E8EAED] bg-white py-16 text-center">
              <Image src="/fox-curious.png" alt="" width={120} height={120} className="mx-auto mb-4" />
              <p className="mt-3 text-sm font-medium text-[#374151]">No listings found</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {listings.map((product) => {
                const cat = Array.isArray(product.categories)
                  ? product.categories[0]
                  : product.categories
                const seller = Array.isArray(product.users)
                  ? product.users[0]
                  : product.users
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
                    isFollowingSeller={followingSet.has(product.seller_id)}
                    isSold={product.is_sold}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- BROWSE MODE ---
  let query = supabase
    .from('products')
    .select(
      'id, title, price, images, condition, status, is_sold, created_at, seller_id, categories(id, name), users(username, avatar_url)'
    )
    .eq('status', 'approved')

  if (sort === 'price_asc') {
    query = query.order('is_sold', { ascending: true }).order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('is_sold', { ascending: true }).order('price', { ascending: false })
  } else {
    query = query.order('is_sold', { ascending: true }).order('created_at', { ascending: false })
  }

  // Auto-match category name from search term (e.g. "Electronics" → select that category)
  let effectiveCategory = category
  if (!category) {
    const autoMatch = (categories ?? []).find(
      (c: { id: string; name: string; icon: string | null }) =>
        c.name.toLowerCase() === (q ?? '').trim().toLowerCase()
    )
    if (autoMatch) effectiveCategory = autoMatch.id
  }

  if (effectiveCategory) query = query.eq('category_id', effectiveCategory)
  if (minPrice) query = query.gte('price', Number(minPrice))
  if (maxPrice) query = query.lte('price', Number(maxPrice))
  if (conditionArray.length > 0) query = query.in('condition', conditionArray)
  if (hideSold === 'true') query = query.eq('is_sold', false)

  const { data: products } = await query

  // Single query for all seller ratings — no N+1
  const sellerIds = [...new Set((products ?? []).map((p: RawProduct) => p.seller_id))]
  const sellerRatingMap = new Map<string, { avg: number; count: number }>()
  if (sellerIds.length > 0) {
    const { data: ratingRows } = await supabase
      .from('reviews')
      .select('seller_id, rating')
      .in('seller_id', sellerIds)
    const agg = new Map<string, { sum: number; count: number }>()
    for (const row of (ratingRows ?? []) as { seller_id: string; rating: number }[]) {
      const e = agg.get(row.seller_id) ?? { sum: 0, count: 0 }
      e.sum += row.rating
      e.count++
      agg.set(row.seller_id, e)
    }
    agg.forEach((v, k) => sellerRatingMap.set(k, { avg: v.sum / v.count, count: v.count }))
  }

  const filterParams = { category, q, sort, minPrice, maxPrice, condition, hideSold }

  const clearSearchParams = new URLSearchParams()
  if (category) clearSearchParams.set('category', category)
  if (sort !== 'newest') clearSearchParams.set('sort', sort)
  if (minPrice) clearSearchParams.set('minPrice', minPrice)
  if (maxPrice) clearSearchParams.set('maxPrice', maxPrice)
  if (condition) clearSearchParams.set('condition', condition)
  if (hideSold) clearSearchParams.set('hideSold', hideSold)
  const clearSearchUrl = clearSearchParams.size > 0
    ? `${basePath}?${clearSearchParams}`
    : basePath

  return (
    <div className="space-y-4">
      <CategoryPills
        categories={categories ?? []}
        activeCategory={effectiveCategory}
        filterParams={filterParams}
        basePath={basePath}
        categoryCounts={categoryCounts}
        totalCount={totalCount}
      />

      {user && <RecentlyViewedRow userId={user.id} />}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold text-[#1F2937] sm:text-xl">All Listings</h1>
          <div className="relative w-full sm:w-56 md:hidden">
            <form action={basePath} method="get">
              {category && <input type="hidden" name="category" value={category} />}
              {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
              {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
              {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
              {condition && <input type="hidden" name="condition" value={condition} />}
              {hideSold && <input type="hidden" name="hideSold" value={hideSold} />}
              <input
                type="text"
                name="q"
                defaultValue={q ?? ''}
                placeholder="Search products, categories or users"
                className={`w-full rounded-lg border border-[#E8EAED] bg-white py-2 text-sm text-[#374151] shadow-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] focus:ring-1 focus:ring-[#F36D21]/20 ${q ? 'pl-3.5 pr-8' : 'px-3.5'}`}
              />
            </form>
            {q && (
              <Link
                href={clearSearchUrl}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X className="size-3.5" />
              </Link>
            )}
          </div>
        </div>

        <FilterPanel sort={sort} filterParams={filterParams} basePath={basePath} />

        <p className="text-xs text-[#9CA3AF]">
          {products?.length ?? 0} listing{products?.length === 1 ? '' : 's'}
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {!products || products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E8EAED] bg-white py-20 text-center">
              <Image src="/fox-curious.png" alt="" width={120} height={120} className="mx-auto mb-4" />
              <p className="mt-3 text-sm font-medium text-[#374151]">No listings found</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                Try a different search or category.
              </p>
              {(q || category) && (
                <Link
                  href={basePath}
                  className="mt-4 rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Clear filters
                </Link>
              )}
            </div>
          ) : (
            products.map(
              (product: RawProduct & { status?: string }) => {
                const cat = Array.isArray(product.categories)
                  ? product.categories[0]
                  : product.categories
                const seller = Array.isArray(product.users)
                  ? product.users[0]
                  : product.users
                const ratingInfo = sellerRatingMap.get(product.seller_id)

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
                    isFollowingSeller={followingSet.has(product.seller_id)}
                    isSold={product.is_sold}
                    sellerRating={ratingInfo?.avg ?? null}
                    sellerReviewCount={ratingInfo?.count ?? 0}
                  />
                )
              }
            )
          )}
        </div>
      </div>
    </div>
  )
}
