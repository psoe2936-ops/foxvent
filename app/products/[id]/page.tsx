import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MessageSellerButton } from '@/components/products/message-seller-button'
import { SellerActionBar } from '@/components/products/seller-action-bar'
import type { Category } from '@/components/profile/new-listing-modal'

type ProductDetailProps = {
  params: Promise<{ id: string }>
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
      'id, title, description, price, condition, images, status, is_sold, views_count, category_id, location, created_at, seller_id, categories(name), users(id, username, full_name, avatar_url, created_at)'
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

  // Non-approved listings are only visible to their seller
  if (product.status !== 'approved' && !isOwnListing) {
    notFound()
  }

  // Fire-and-forget view increment (skip for seller's own views)
  if (!isOwnListing) {
    void supabase
      .from('products')
      .update({ views_count: (product.views_count ?? 0) + 1 })
      .eq('id', id)
  }

  // Fetch categories only when the seller needs the Edit modal
  let categories: Category[] = []
  if (isOwnListing) {
    const { data } = await supabase.from('categories').select('id, name, icon').order('name')
    categories = (data as Category[]) ?? []
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-[#6B7280] hover:text-[#2D2E32]">
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
        {/* Images */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
            {product.images && product.images.length > 0 ? (
              product.images.map((img: string, i: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt={`${product.title} photo ${i + 1}`}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))
            ) : (
              <div className="col-span-2 flex aspect-video items-center justify-center rounded-xl bg-[#F3F4F6] text-sm text-[#9CA3AF]">
                No images
              </div>
            )}
          </div>
          {product.is_sold && (
            <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Sold
            </div>
          )}
        </div>

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
            href={`/profile/${seller?.username}`}
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
            <div className="mt-5 w-full">
              <MessageSellerButton
                productId={product.id}
                sellerId={seller.id}
              />
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
    </main>
  )
}
