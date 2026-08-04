'use client'

import { useTranslations } from 'next-intl'
import { HoverEdgeScroll } from '@/components/feed/hover-edge-scroll'
import { buildMarketplaceHref } from '@/lib/marketplace-url'

type SortOption = 'newest' | 'popular' | 'price_asc' | 'price_desc'

type SortTabsProps = {
  sort: SortOption
  filterParams: { category?: string; q?: string; sort?: string }
  basePath?: string
}

export function SortTabs({ sort, filterParams, basePath = '/' }: SortTabsProps) {
  const t = useTranslations('feed')
  const SORT_TABS: { id: SortOption; label: string }[] = [
    { id: 'newest', label: t('newest') },
    { id: 'popular', label: t('popular') },
    { id: 'price_asc', label: t('priceLowHigh') },
    { id: 'price_desc', label: t('priceHighLow') },
  ]
  return (
    <HoverEdgeScroll className="min-w-0 flex-1 cursor-default">
      <div className="flex w-max gap-6">
        {SORT_TABS.map((tab) => {
          const isActive = tab.id === sort
          
          return (
            <a
              key={tab.id}
              href={buildMarketplaceHref(filterParams, { sort: tab.id }, basePath)}
              className={`shrink-0 pb-4 text-sm transition-colors ${
                isActive
                  ? 'border-b-2 border-[#F36D21] font-semibold text-[#F36D21]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              {tab.label}
            </a>
          )
        })}
      </div>
    </HoverEdgeScroll>
  )
}
