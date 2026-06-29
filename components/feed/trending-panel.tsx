import Link from 'next/link'
import { ChevronRight, Tag } from 'lucide-react'

export type TrendingItem = {
  id: string
  name: string
  icon: string | null
  count: number
}

export function TrendingPanel({
  items,
  label,
}: {
  items: TrendingItem[]
  label: string
}) {
  return (
    <section className="rounded-xl border border-[#E8EAED] bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1F2937]">Trending Near You</h2>
        <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-[#9CA3AF]">Nothing here yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#F3F4F6]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/feed?category=${item.id}`}
                className="group flex items-center gap-3 py-2.5"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F9FAFB] text-base"
                  aria-hidden
                >
                  {item.icon ? (
                    item.icon
                  ) : (
                    <Tag className="size-4 text-[#9CA3AF]" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#374151] transition-colors group-hover:text-[#F36D21]">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {item.count} listing{item.count === 1 ? '' : 's'}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-[#D1D5DB] transition-colors group-hover:text-[#F36D21]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
