import Link from 'next/link'
import { Check, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RejectButton } from '@/components/admin/reject-button'
import { AdminDeleteButton } from '@/components/admin/admin-delete-button'
import { AdminProductFilters } from '@/components/admin/admin-product-filters'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { approveProduct } from './actions'

type SearchParams = Promise<{
  status?: string
  category?: string
  sort?: string
}>

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { status = 'pending', category = '', sort = 'newest' } = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  let query = supabase
    .from('products')
    .select(
      'id, title, price, images, status, created_at, users(username), categories(id, name)'
    )

  if (status !== 'all') {
    query = query.eq('status', status)
  }
  if (category) {
    query = query.eq('category_id', category)
  }

  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else if (sort === 'price_high') {
    query = query.order('price', { ascending: false })
  } else if (sort === 'price_low') {
    query = query.order('price', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: products } = await query

  const { count: pendingCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All Listings' },
  ]

  const statusTitle: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved Listings',
    rejected: 'Rejected Listings',
    all: 'All Listings',
  }

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      pending: 'bg-[#FEF3E2] text-[#C26A08]',
      approved: 'bg-[#E8F5E9] text-[#1A7A4A]',
      rejected: 'bg-[#FDEDEC] text-[#C0392B]',
    }
    return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[s] ?? 'bg-[#F3F4F6] text-[#6B7280]'}`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1F2937]">
          {statusTitle[status] ?? 'Listings'}
        </h1>
        {(pendingCount ?? 0) > 0 && status !== 'pending' && (
          <p className="mt-0.5 text-sm text-[#C26A08]">
            {pendingCount} listing{pendingCount === 1 ? '' : 's'} awaiting review
          </p>
        )}
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/products?status=${tab.key}${category ? `&category=${category}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === tab.key
                ? 'bg-[#1F2937] text-white'
                : 'border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#1F2937]'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4">
        <AdminProductFilters
          categories={categories ?? []}
          currentCategory={category}
          currentSort={sort}
          currentStatus={status}
        />
      </div>

      {/* Table */}
      {!products || products.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-white">
          <p className="text-sm text-[#9CA3AF]">No listings in this view.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Product
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Seller
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Submitted
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images?.[0] ?? ''}
                        alt=""
                        className="size-10 shrink-0 rounded-lg bg-[#F3F4F6] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="max-w-[180px] truncate font-medium text-[#1F2937]">
                          {product.title}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          MMK {product.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#4B5563]">
                    @{product.users?.username ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#4B5563]">
                    {product.categories?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#9CA3AF]">
                    {formatRelativeTime(product.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(product.status)}>{product.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/products/${product.id}`}
                        title="View details"
                        className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#1F2937]"
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      {product.status === 'pending' && (
                        <>
                          <form action={approveProduct}>
                            <input type="hidden" name="productId" value={product.id} />
                            <button
                              type="submit"
                              title="Approve"
                              className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#1A7A4A] transition-colors hover:bg-[#E8F5E9]"
                            >
                              <Check className="size-3.5" />
                            </button>
                          </form>
                          <RejectButton productId={product.id} />
                        </>
                      )}
                      <AdminDeleteButton productId={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
