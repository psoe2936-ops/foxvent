'use client'

import { useRouter } from 'next/navigation'

type Props = {
  categories: { id: string; name: string }[]
  currentCategory: string
  currentSort: string
  currentStatus: string
}

export function AdminProductFilters({
  categories,
  currentCategory,
  currentSort,
  currentStatus,
}: Props) {
  const router = useRouter()

  function navigate(key: 'category' | 'sort', value: string) {
    const sp = new URLSearchParams()
    sp.set('status', currentStatus)
    if (key === 'category') {
      if (value) sp.set('category', value)
      sp.set('sort', currentSort)
    } else {
      if (currentCategory) sp.set('category', currentCategory)
      sp.set('sort', value)
    }
    router.push(`/admin/products?${sp.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentCategory}
        onChange={(e) => navigate('category', e.target.value)}
        className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#2D2E32] focus:border-[#F36D21] focus:outline-none"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={currentSort}
        onChange={(e) => navigate('sort', e.target.value)}
        className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#2D2E32] focus:border-[#F36D21] focus:outline-none"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="price_high">Price: high to low</option>
        <option value="price_low">Price: low to high</option>
      </select>

      <button
        type="button"
        disabled
        className="ml-auto cursor-not-allowed rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#9CA3AF]"
      >
        Export
      </button>
    </div>
  )
}
