import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MessageSellerButton } from '@/components/products/message-seller-button'
import { MakeOfferButton } from '@/components/products/make-offer-button'
import { SellerActionBar } from '@/components/products/seller-action-bar'
import { ReportButton } from '@/components/products/report-button'
import { ImageGallery } from '@/components/products/image-gallery'
import { MoreFromSeller } from '@/components/products/more-from-seller'
import { SimilarListings } from '@/components/products/similar-listings'
import { ShareButton } from '@/components/products/share-button'
import { FeedSidebar } from '@/components/feed/sidebar'
import { TrendingPanel, type TrendingItem } from '@/components/feed/trending-panel'
import type { Category } from '@/components/profile/new-listing-modal'

type ProductDetailProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('title, description, images')
    .eq('id', id)
    .single()

  if (!product) return { title: 'Listing not found — FoxVent' }

  const title = `${product.title} — FoxVent`
  const description = product.description
    ? product.description.slice(0, 160)
    : `Buy ${product.title} on FoxVent — verified second-hand marketplace.`
  const image = product.images?.[0]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

const CONDITION_LABEL: Record<string, string> = {
  new: 'New with tags',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
}

export default async function PublicProductPage({ params }: ProductDetailProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(
      'id, title, description, price, condition, images, status, is_sold, views_count, category_id, location, created_at, seller_id, rejection_reason, categories(name), users(id, username, full_name, avatar_url, created_at)'
    )
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  const seller = Array.isArray(product.users) ? product.users[0] : product.users
  const category = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()

  const isOwnListing = viewer?.id === product.seller_id

  if (product.status !== 'approved' && !isOwnListing) {
    notFound()
  }

  // Fire-and-forget view increment
  if (!isOwnListing) {
    void supabase
      .from('products')
      .update({ views_count: (product.views_count ?? 0) + 1 })
      .eq('id', id)
  }

  // Fire-and-forget recently-viewed tracking (logged-in, non-owner views only)
  if (viewer && !isOwnListing) {
    void supabase.from('recently_viewed').upsert(
      { user_id: viewer.id, product_id: id, viewed_at: new Date().toISOString() },
      { onConflict: 'user_id,product_id' },
    )
  }

  let categories: Category[] = []
  if (isOwnListing) {
    const { data } = await supabase.from('categories').select('id, name, icon').order('name')
    categories = (data as Category[]) ?? []
  }

  const [{ count: otherListingCount }, { data: trendingProds }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', product.seller_id)
      .eq('status', 'approved')
      .eq('is_sold', false)
      .neq('id', id),
    supabase
      .from('products')
      .select('category_id, views_count, categories(id, name, icon)')
      .eq('status', 'approved'),
  ])

  const hasOtherListings = (otherListingCount ?? 0) > 0

  const trendingItems: TrendingItem[] = (() => {
    const map = new Map<string, { item: TrendingItem; viewSum: number }>()
    for (const p of trendingProds ?? []) {
      const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
      if (!cat) continue
      const key = (cat as { id: string; name: string; icon: string | null }).id
      if (!map.has(key)) {
        map.set(key, {
          item: { id: key, name: (cat as { name: string }).name, icon: (cat as { icon: string | null }).icon ?? null, count: 0 },
          viewSum: 0,
        })
      }
      const entry = map.get(key)!
      entry.item.count++
      entry.viewSum += (p as { views_count?: number }).views_count ?? 0
    }
    return Array.from(map.values())
      .sort((a, b) => b.viewSum - a.viewSum || b.item.count - a.item.count)
      .slice(0, 5)
      .map((e) => e.item)
  })()

  return (
    <div className="w-full py-4 pb-24 lg:py-6 lg:pb-10">
      <div className="flex w-full items-start">
        {/* Left sidebar */}
        <FeedSidebar userId={viewer?.id} />

        {/* Center content */}
        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-10">
          <Link href="/feed" className="text-sm text-[#6B7280] hover:text-[#2D2E32]">
            ← Back to browse
          </Link>

          {/* Status banner for seller viewing non-approved listings */}
          {isOwnListing && product.status !== 'approved' && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                product.status === 'pending'
                  ? 'bg-[#FEF3E2] text-[#C26A08]'
                  : 'bg-[#FDEDEC] text-[#C0392B]'
              }`}
            >
              {product.status === 'pending'
                ? 'This listing is pending review and is not yet visible to buyers.'
                : `This listing was rejected${product.rejection_reason ? `: ${product.rejection_reason}` : '. You can edit and resubmit it.'}`}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Images with lightbox */}
            <ImageGallery
              images={product.images ?? []}
              title={product.title}
              isSold={product.is_sold ?? false}
            />

            {/* Details */}
            <div>
              {category && (
                <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#6B7280]">
                  {category.name}
                </span>
              )}

              <h1 className="mt-3 text-2xl font-bold text-[#2D2E32]">{product.title}</h1>
              <p className="mt-1 text-3xl font-bold text-[#F36D21]">
                MMK {product.price.toLocaleString()}
              </p>

              <span className="mt-3 inline-block rounded-full bg-[#EBF2FA] px-3 py-1 text-xs font-medium text-[#1B4F8C]">
                {CONDITION_LABEL[product.condition] ?? product.condition}
              </span>

              <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-[#4B5563]">
                {product.description || 'No description provided.'}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs text-[#9CA3AF]">
                <span>Listed {new Date(product.created_at).toLocaleDateString()}</span>
                {(product.views_count ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {product.views_count} view{product.views_count === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <Link
                href={seller?.username ? `/profile/${seller.username}` : '/feed'}
                className="mt-6 flex items-center gap-3 rounded-2xl border border-[#E5E7EB] p-4 hover:bg-[#F9FAFB]"
              >
                {seller?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={seller.avatar_url}
                    alt=""
                    className="size-11 rounded-full bg-[#F3F4F6] object-cover"
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#E5E7EB] text-sm font-semibold text-[#6B7280]">
                    {(seller?.full_name?.[0] ?? seller?.username?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#2D2E32]">{seller?.full_name}</p>
                  <p className="text-xs text-[#6B7280]">@{seller?.username}</p>
                </div>
              </Link>

              {!isOwnListing && seller && !product.is_sold && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MessageSellerButton
                    productId={product.id}
                    sellerId={seller.id}
                  />
                  <MakeOfferButton
                    productId={product.id}
                    sellerId={seller.id}
                  />
                  <ShareButton title={product.title} price={product.price} />
                </div>
              )}

              {!isOwnListing && viewer && (
                <div className="mt-3 flex justify-center">
                  <ReportButton productId={product.id} viewerId={viewer.id} />
                </div>
              )}

              {isOwnListing && (
                <SellerActionBar
                  product={{
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    price: product.price,
                    condition: product.condition,
                    category_id: product.category_id,
                    location: product.location,
                    status: product.status,
                    is_sold: product.is_sold ?? false,
                  }}
                  categories={categories}
                  sellerUsername={seller?.username ?? ''}
                />
              )}
            </div>
          </div>

          <SimilarListings
            currentProductId={product.id}
            categoryId={product.category_id}
            viewerId={viewer?.id ?? null}
          />
        </div>

        {/* Right panel */}
        <aside className="scrollbar-none sticky top-20 hidden h-[calc(100vh-5rem)] w-75 shrink-0 flex-col overflow-y-auto border-l border-[#E8EAED] bg-[#F9FAFB] py-6 pl-4 pr-5 xl:flex xl:pr-6">
          {hasOtherListings && seller ? (
            <MoreFromSeller
              sellerId={product.seller_id}
              sellerUsername={seller.username ?? ''}
              currentProductId={product.id}
            />
          ) : (
            <TrendingPanel items={trendingItems} label="Most popular" />
          )}
        </aside>
      </div>
    </div>
  )
}
