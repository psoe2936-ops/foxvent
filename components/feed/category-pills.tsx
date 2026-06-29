import { buildMarketplaceHref } from '@/lib/marketplace-url'
import { HoverEdgeScroll } from '@/components/feed/hover-edge-scroll'

type Category = {
  id: string
  name: string
  icon: string | null
}

type CategoryPillsProps = {
  categories: Category[]
  activeCategory?: string
  filterParams: { category?: string; q?: string; sort?: string }
  basePath?: string
}

export function CategoryPills({
  categories,
  activeCategory,
  filterParams,
  basePath = '/',
}: CategoryPillsProps) {
  return (
    <HoverEdgeScroll className="-mx-1 px-1 pb-0.5">
      <div className="flex w-max gap-2">
        <a
          href={buildMarketplaceHref(filterParams, { category: undefined }, basePath)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            !activeCategory
              ? 'border-[#1F2937] bg-[#1F2937] text-white'
              : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] hover:border-[#D1D5DB] hover:bg-white'
          }`}
        >
          All
        </a>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <a
              key={cat.id}
              href={buildMarketplaceHref(filterParams, { category: cat.id }, basePath)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-[#1F2937] bg-[#1F2937] text-white'
                  : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] hover:border-[#D1D5DB] hover:bg-white'
              }`}
            >
              {cat.name}
            </a>
          )
        })}
      </div>
    </HoverEdgeScroll>
  )
}
