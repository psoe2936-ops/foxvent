import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  Armchair,
  BookOpen,
  ChevronRight,
  Cpu,
  Dumbbell,
  Home,
  Package,
  Shirt,
  Smartphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Cpu,
  mobiles: Smartphone,
  phones: Smartphone,
  mobile: Smartphone,
  fashion: Shirt,
  clothing: Shirt,
  books: BookOpen,
  home: Home,
  sports: Dumbbell,
  furniture: Armchair,
}

function CategoryIcon({ name }: { name: string }) {
  const key = name.toLowerCase().trim()
  const Icon =
    Object.entries(CATEGORY_ICONS).find(([k]) => key.includes(k))?.[1] ?? Package
  return <Icon className="size-4 text-[#6B7280]" />
}

export type TrendingItem = {
  id: string
  name: string
  icon: string | null
  count: number
}

export async function TrendingPanel({
  items,
  label,
}: {
  items: TrendingItem[]
  label: string
}) {
  const t = await getTranslations('feed')
  const tCat = await getTranslations('categories')

  return (
    <section className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div>
        <h2 className="text-sm font-semibold text-[#1F2937]">
          {t('trendingNearYou')}
        </h2>
        <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#9CA3AF]">Nothing here yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#F3F4F6]">
          {items.map((item) => {
            const nameKey = item.name.toLowerCase()
            const translatedName = tCat.has(nameKey)
              ? tCat(nameKey as any)
              : item.name

            return (
              <li key={item.id}>
                <Link
                  href={`/feed?category=${item.id}`}
                  className="group flex items-center gap-3 py-2.5"
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]"
                    aria-hidden
                  >
                    <CategoryIcon name={item.name} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#374151] transition-colors group-hover:text-[#F36D21]">
                      {translatedName}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {item.count} {t('listings')}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-[#D1D5DB] transition-colors group-hover:text-[#F36D21]" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}