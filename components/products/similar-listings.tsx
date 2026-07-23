import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/feed/product-card'

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

type RawProduct = {
  id: string
  title: string
  price: number
  images: string[] | null
  condition: string
  created_at: string
  seller_id: string
  categories: { name: string } | { name: string }[] | null
  users:
    | { username: string; avatar_url: string | null }
    | { username: string; avatar_url: string | null }[]
    | null
}

export async function SimilarListings({
  currentProductId,
  categoryId,
  viewerId,
}: {
  currentProductId: string
  categoryId: string | null
  viewerId?: string | null
}) {
  const supabase = await createClient()

  const baseSelect =
    'id, title, price, images, condition, created_at, seller_id, categories(name), users(username, avatar_url)'

  let items: RawProduct[] = []

  if (categoryId) {
    const { data } = await supabase
      .from('products')
      .select(baseSelect)
      .eq('status', 'approved')
      .eq('is_sold', false)
      .eq('category_id', categoryId)
      .neq('id', currentProductId)
      .order('created_at', { ascending: false })
      .limit(4)
    items = (data as RawProduct[]) ?? []
  }

  if (items.length < 4) {
    const excludeIds = [currentProductId, ...items.map((p) => p.id)]
    const { data: fillerData } = await supabase
      .from('products')
      .select(baseSelect)
      .eq('status', 'approved')
      .eq('is_sold', false)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(4 - items.length)
    items = [...items, ...((fillerData as RawProduct[]) ?? [])]
  }

  if (items.length === 0) return null

  let savedSet = new Set<string>()
  let followingSet = new Set<string>()
  if (viewerId) {
    const ids = items.map((p) => p.id)
    const sellerIds = [...new Set(items.map((p) => p.seller_id))]
    const [wishlistRes, followsRes] = await Promise.all([
      supabase.from('wishlists').select('product_id').eq('user_id', viewerId).in('product_id', ids),
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerId)
        .in('following_id', sellerIds),
    ])
    savedSet = new Set((wishlistRes.data ?? []).map((r: { product_id: string }) => r.product_id))
    followingSet = new Set(
      (followsRes.data ?? []).map((r: { following_id: string }) => r.following_id),
    )
  }

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-lg font-bold text-[#1F2937]">You might also like</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((product) => {
          const cat = Array.isArray(product.categories) ? product.categories[0] : product.categories
          const seller = Array.isArray(product.users) ? product.users[0] : product.users
          return (
            <div key={product.id} className="w-44 shrink-0 sm:w-52">
              <ProductCard
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
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
