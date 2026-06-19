import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RejectButton } from '@/components/admin/reject-button'
import { approveProduct } from './actions'

type SearchParams = Promise<{ status?: string }>

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { status = 'pending' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(
      'id, title, price, images, status, created_at, rejection_reason, users(username), categories(name)'
    )
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: products } = await query

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2D2E32]">Products</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Review and moderate marketplace listings.
      </p>

      <div className="mt-6 flex gap-2 border-b border-[#E5E7EB]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/products?status=${tab.key}`}
            className={`px-4 py-2 text-sm font-medium ${
              status === tab.key
                ? 'border-b-2 border-[#F36D21] text-[#F36D21]'
                : 'text-[#6B7280] hover:text-[#2D2E32]'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {!products || products.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No products in this view.</p>
        ) : (
          products.map((product: any) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images?.[0] ?? ''}
                alt=""
                className="size-16 shrink-0 rounded-lg object-cover bg-[#F3F4F6]"
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#2D2E32]">{product.title}</p>
                <p className="text-sm text-[#6B7280]">
                  @{product.users?.username} · {product.categories?.name} · ₹
                  {product.price}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
                {product.status === 'rejected' && product.rejection_reason && (
                  <p className="mt-1 text-xs text-[#C0392B]">
                    Reason: {product.rejection_reason}
                  </p>
                )}
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  product.status === 'pending'
                    ? 'bg-[#FEF3E2] text-[#C26A08]'
                    : product.status === 'approved'
                    ? 'bg-[#E8F5E9] text-[#1A7A4A]'
                    : 'bg-[#FDEDEC] text-[#C0392B]'
                }`}
              >
                {product.status}
              </span>

              {product.status === 'pending' && (
                <div className="flex shrink-0 gap-2">
                  <form action={approveProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-[#1A7A4A] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Approve
                    </button>
                  </form>
                  <RejectButton productId={product.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}