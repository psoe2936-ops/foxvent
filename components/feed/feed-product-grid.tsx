import { SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CategoryPills } from '@/components/feed/category-pills'
import { ProductCard } from '@/components/feed/product-card'
import { SortTabs } from '@/components/feed/sort-tabs'

type SearchParams = {
  category?: string
  q?: string
  sort?: string
}

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

type SortOption = 'newest' | 'price_asc' | 'price_desc'

export async function FeedProductGrid({
  searchParams,
  basePath = '/feed',
}: {
  searchParams: SearchParams
  basePath?: string
}) {
  const { category, q, sort: sortParam } = searchParams
  const sort: SortOption =
    sortParam === 'price_asc' || sortParam === 'price_desc' ? sortParam : 'newest'

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

  if (category) query = query.eq('category_id', category)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: products } = await query
  const filterParams = { category, q, sort }

  return (
    <div className="space-y-4">
      <CategoryPills
        categories={categories ?? []}
        activeCategory={category}
        filterParams={filterParams}
        basePath={basePath}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold text-[#1F2937] sm:text-xl">All Listings</h1>
          <form action={basePath} method="get" className="w-full sm:w-auto">
            {category && <input type="hidden" name="category" value={category} />}
            {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search listings..."
              className="w-full rounded-lg border border-[#E8EAED] bg-white px-3.5 py-2 text-sm text-[#374151] shadow-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] focus:ring-1 focus:ring-[#F36D21]/20 sm:w-56"
            />
          </form>
        </div>

        <div className="flex items-center justify-between border-b border-[#E8EAED] pb-1">
          <SortTabs sort={sort} filterParams={filterParams} basePath={basePath} />
          <button
            type="button"
            disabled
            className="mb-2 hidden shrink-0 items-center gap-1.5 rounded-lg border border-[#E8EAED] bg-white px-3 py-1.5 text-xs font-medium text-[#9CA3AF] sm:flex"
            title="Filters coming soon"
          >
            <SlidersHorizontal className="size-3.5" />
            Filter
          </button>
        </div>

        <p className="text-xs text-[#9CA3AF]">
          {products?.length ?? 0} listing{products?.length === 1 ? '' : 's'}
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {!products || products.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E8EAED] bg-white py-20 text-center">
              <p className="text-sm font-medium text-[#374151]">No listings found</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                Try a different search or category.
              </p>
            </div>
          ) : (
            products.map(
              (product: {
                id: string
                title: string
                price: number
                images: string[] | null
                condition: string
                is_sold: boolean
                created_at: string
                seller_id: string
                categories:
                  | { id: string; name: string }
                  | { id: string; name: string }[]
                  | null
                users:
                  | { username: string; avatar_url: string | null }
                  | { username: string; avatar_url: string | null }[]
                  | null
              }) => {
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
              }
            )
          )}
        </div>
      </div>
    </div>
  )
}
