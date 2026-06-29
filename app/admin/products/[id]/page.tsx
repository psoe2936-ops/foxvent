import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RejectButton } from '@/components/admin/reject-button'
import { approveProduct } from '../actions'

type ProductDetailProps = {
  params: Promise<{ id: string }>
}

export default async function AdminProductDetailPage({
  params,
}: ProductDetailProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(
      `id, title, description, price, condition, images, status, created_at,
       approved_at, rejection_reason,
       users(id, username, full_name, avatar_url, created_at),
       categories(name)`
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

  const { count: sellerListingCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', seller?.id)

  const { count: sellerRejectedCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', seller?.id)
    .eq('status', 'rejected')

  const conditionLabel: Record<string, string> = {
    new: 'New with tags',
    like_new: 'Like new',
    good: 'Good',
    fair: 'Fair',
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm text-[#6B7280] hover:text-[#2D2E32]"
      >
        ← Back to products
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — images + description */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              <div className="col-span-3 flex aspect-video items-center justify-center rounded-xl bg-[#F3F4F6] text-sm text-[#9CA3AF]">
                No images
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="font-semibold text-[#2D2E32]">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#4B5563]">
              {product.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Right — info + actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                product.status === 'pending'
                  ? 'bg-[#FEF3E2] text-[#C26A08]'
                  : product.status === 'approved'
                  ? 'bg-[#E8F5E9] text-[#1A7A4A]'
                  : 'bg-[#FDEDEC] text-[#C0392B]'
              }`}
            >
              {product.status}
            </span>

            <h1 className="mt-3 text-xl font-bold text-[#2D2E32]">
              {product.title}
            </h1>
            <p className="mt-1 text-2xl font-bold text-[#F36D21]">
              MMK {product.price.toLocaleString()}
            </p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Category</dt>
                <dd className="text-[#2D2E32]">{category?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Condition</dt>
                <dd className="text-[#2D2E32]">
                  {conditionLabel[product.condition] ?? product.condition}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Submitted</dt>
                <dd className="text-[#2D2E32]">
                  {new Date(product.created_at).toLocaleDateString()}
                </dd>
              </div>
              {product.approved_at && (
                <div className="flex justify-between">
                  <dt className="text-[#6B7280]">Approved</dt>
                  <dd className="text-[#2D2E32]">
                    {new Date(product.approved_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>

            {product.status === 'rejected' && product.rejection_reason && (
              <div className="mt-4 rounded-lg bg-[#FDEDEC] p-3 text-sm text-[#C0392B]">
                <strong>Rejection reason:</strong> {product.rejection_reason}
              </div>
            )}
          </div>

          {/* Seller card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#2D2E32]">Seller</h2>
            <Link
              href={`/profile/${seller?.username}`}
              className="mt-3 flex items-center gap-3 hover:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={seller?.avatar_url ?? ''}
                alt=""
                className="size-10 rounded-full bg-[#F3F4F6] object-cover"
              />
              <div>
                <p className="text-sm font-medium text-[#2D2E32]">
                  {seller?.full_name}
                </p>
                <p className="text-xs text-[#6B7280]">@{seller?.username}</p>
              </div>
            </Link>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Member since</dt>
                <dd className="text-[#2D2E32]">
                  {seller?.created_at
                    ? new Date(seller.created_at).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Total listings</dt>
                <dd className="text-[#2D2E32]">{sellerListingCount ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6B7280]">Past rejections</dt>
                <dd
                  className={
                    (sellerRejectedCount ?? 0) > 0
                      ? 'font-medium text-[#C0392B]'
                      : 'text-[#2D2E32]'
                  }
                >
                  {sellerRejectedCount ?? 0}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          {product.status === 'pending' && (
            <div className="flex gap-2">
              <form action={approveProduct} className="flex-1">
                <input type="hidden" name="productId" value={product.id} />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#1A7A4A] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Approve listing
                </button>
              </form>
              <div className="flex-1">
                <RejectButton productId={product.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}