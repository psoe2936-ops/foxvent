'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SortTabs } from '@/components/feed/sort-tabs'
import { buildMarketplaceHref, type MarketplaceFilterParams } from '@/lib/marketplace-url'

type SortOption = 'newest' |'popular'| 'price_asc' | 'price_desc'

export function FilterPanel({
  sort,
  filterParams,
  basePath = '/',
}: {
  sort: SortOption
  filterParams: MarketplaceFilterParams
  basePath?: string
}) {
  const t = useTranslations('feed')
  const tProduct = useTranslations('product')
  const CONDITIONS: { id: string; label: string }[] = [
    { id: 'new', label: tProduct('conditionNew') },
    { id: 'like_new', label: tProduct('conditionLikeNew') },
    { id: 'good', label: tProduct('conditionGood') },
    { id: 'fair', label: tProduct('conditionFair') },
  ]
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [minPrice, setMinPrice] = useState(filterParams.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(filterParams.maxPrice ?? '')
  const [conditions, setConditions] = useState<string[]>(
    filterParams.condition ? filterParams.condition.split(',') : []
  )
  const [hideSold, setHideSold] = useState(filterParams.hideSold === 'true')

  const activeCount =
    (filterParams.minPrice || filterParams.maxPrice ? 1 : 0) +
    (filterParams.condition ? 1 : 0) +
    (filterParams.hideSold === 'true' ? 1 : 0)

  function toggleCondition(id: string) {
    setConditions((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function applyFilters() {
    const href = buildMarketplaceHref(
      filterParams,
      {
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        condition: conditions.length > 0 ? conditions.join(',') : undefined,
        hideSold: hideSold ? 'true' : undefined,
      },
      basePath
    )
    router.push(href)
    setOpen(false)
  }

  const clearHref = buildMarketplaceHref(
    filterParams,
    { minPrice: undefined, maxPrice: undefined, condition: undefined, hideSold: undefined },
    basePath
  )

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#E8EAED] pb-1">
        <SortTabs sort={sort} filterParams={filterParams} basePath={basePath} />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`mb-2 flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeCount > 0
              ? 'border-[#F36D21] bg-[#FEF3E2] text-[#F36D21]'
              : 'border-[#E8EAED] bg-white text-[#6B7280] hover:bg-[#F9FAFB]'
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          {activeCount > 0 ? t('filterWithCount', { count: activeCount }) : t('filter')}
        </button>
      </div>

      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0">
          <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex flex-wrap items-start gap-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  {t('priceRange')}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={t('minPricePlaceholder')}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-28 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-sm text-[#374151] outline-none focus:border-[#F36D21] focus:ring-1 focus:ring-[#F36D21]/20"
                  />
                  <span className="text-sm text-[#9CA3AF]">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={t('maxPricePlaceholder')}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-28 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-sm text-[#374151] outline-none focus:border-[#F36D21] focus:ring-1 focus:ring-[#F36D21]/20"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  {tProduct('condition')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => {
                    const active = conditions.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCondition(c.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? 'border-[#1F2937] bg-[#1F2937] text-white'
                            : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] hover:border-[#D1D5DB]'
                        }`}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  {t('soldItems')}
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]">
                  <input
                    type="checkbox"
                    checked={hideSold}
                    onChange={(e) => setHideSold(e.target.checked)}
                    className="size-4 rounded border-[#E5E7EB] text-[#F36D21] focus:ring-[#F36D21]/20"
                  />
                  {t('hideSoldItems')}
                </label>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-[#F3F4F6] pt-3">
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {t('apply')}
              </button>
              {activeCount > 0 && (
                <a href={clearHref} className="text-sm text-[#F36D21] hover:underline">
                  {t('clearAll')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
