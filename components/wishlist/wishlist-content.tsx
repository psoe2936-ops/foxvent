import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/feed/product-card'

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
}

export async function WishlistContent({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: wishlistRows } = await supabase
    .from('wishlists')
    .select(
      `product_id,
       products(
         id, title, price, images, condition, status, is_sold, created_at,
         categories(name),
         users(username, avatar_url)
       )`
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const savedProducts = (wishlistRows ?? [])
    .map((row: any) => (Array.isArray(row.products) ? row.products[0] : row.products))
    .filter((p: any) => p && p.status === 'approved')

  return (
    <div>
      <div className="flex items-center gap-2">
        <Heart className="size-6 text-[#F36D21]" fill="#F36D21" />
        <h1 className="text-2xl font-bold text-[#1F2937]">My Wishlist</h1>
      </div>
      <p className="mt-1 text-sm text-[#6B7280]">
        {savedProducts.length} saved item{savedProducts.length === 1 ? '' : 's'}
      </p>

      {savedProducts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
          <Heart className="size-10 text-[#D1D5DB]" />
          <p className="mt-4 text-base font-medium text-[#1F2937]">No saved items yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Tap the heart on any listing to save it here.
          </p>
          <Link
            href="/feed"
            className="mt-5 rounded-lg bg-[#F36D21] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {savedProducts.map((product: any) => {
            const category = Array.isArray(product.categories)
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
                categoryName={category?.name}
                sellerUsername={seller?.username}
                sellerAvatar={seller?.avatar_url}
                createdAt={product.created_at}
                initialSaved={true}
                isSold={product.is_sold ?? false}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
