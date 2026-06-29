import { SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CategoryPills } from '@/components/feed/category-pills'
import { FeedRightSidebar } from '@/components/feed/right-sidebar'
import { ProductCard } from '@/components/feed/product-card'
import { FeedSidebar } from '@/components/feed/sidebar'
import { SortTabs } from '@/components/feed/sort-tabs'

type SearchParams = {
  category?: string
  q?: string
  sort?: string
}

type MarketplaceFeedProps = {
  searchParams: SearchParams
  basePath?: string
}

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

type SortOption = 'newest' | 'price_asc' | 'price_desc'

export async function MarketplaceFeed({
  searchParams,
  basePath = '/',
}: MarketplaceFeedProps) {
  const { category, q, sort: sortParam } = searchParams
  const sort: SortOption =
    sortParam === 'price_asc' || sortParam === 'price_desc'
      ? sortParam
      : 'newest'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let viewerUsername: string | undefined
  let savedSet = new Set<string>()

  if (user) {
    const [profileResult, wishlistResult] = await Promise.all([
      supabase.from('users').select('username').eq('id', user.id).single(),
      supabase.from('wishlists').select('product_id').eq('user_id', user.id),
    ])
    viewerUsername = profileResult.data?.username
    savedSet = new Set(
      (wishlistResult.data ?? []).map((r: { product_id: string }) => r.product_id)
    )
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .order('name')

  let query = supabase
    .from('products')
    .select(
      'id, title, price, images, condition, status, created_at, categories(id, name), users(username, avatar_url)'
    )
    .eq('status', 'approved')

  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (category) {
    query = query.eq('category_id', category)
  }
  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const { data: products } = await query

  const filterParams = { category, q, sort }

  return (
    <main className="w-full py-4 pb-10 lg:py-6">
      <div className="flex w-full items-start">
        <FeedSidebar username={viewerUsername} userId={user?.id} />

        <div className="min-w-0 flex-1 space-y-4 px-4 sm:px-6 lg:px-10">
          <CategoryPills
            categories={categories ?? []}
            activeCategory={category}
            filterParams={filterParams}
            basePath={basePath}
          />

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-lg font-bold text-[#1F2937] sm:text-xl">
                All Listings
              </h1>
              <form action={basePath} method="get" className="w-full sm:w-auto">
                {category && (
                  <input type="hidden" name="category" value={category} />
                )}
                {sort !== 'newest' && (
                  <input type="hidden" name="sort" value={sort} />
                )}
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
              {products?.length ?? 0} listing
              {products?.length === 1 ? '' : 's'}
            </p>

            <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3">
              {!products || products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E8EAED] bg-white py-20 text-center">
                  <p className="text-sm font-medium text-[#374151]">
                    No listings found
                  </p>
                  <p className="mt-1 text-sm text-[#9CA3AF]">
                    Try a different search or category.
                  </p>
                </div>
              ) : (
                products.map((product: {
                  id: string
                  title: string
                  price: number
                  images: string[] | null
                  condition: string
                  created_at: string
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
                      conditionLabel={
                        CONDITION_LABEL[product.condition] ??
                        product.condition
                      }
                      conditionKey={product.condition}
                      categoryName={cat?.name}
                      sellerUsername={seller?.username}
                      sellerAvatar={seller?.avatar_url}
                      createdAt={product.created_at}
                      initialSaved={savedSet.has(product.id)}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>

        <FeedRightSidebar />
      </div>
    </main>
  )
}
