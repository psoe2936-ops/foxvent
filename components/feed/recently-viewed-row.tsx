import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type RawRow = {
  viewed_at: string
  products:
    | { id: string; title: string; price: number; images: string[] | null; status: string }
    | { id: string; title: string; price: number; images: string[] | null; status: string }[]
    | null
}

export async function RecentlyViewedRow({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('recently_viewed')
    .select('viewed_at, products(id, title, price, images, status)')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(8)

  const items = ((data as RawRow[]) ?? [])
    .map((row) => (Array.isArray(row.products) ? row.products[0] : row.products))
    .filter((p): p is { id: string; title: string; price: number; images: string[] | null; status: string } =>
      !!p && p.status === 'approved'
    )

  if (items.length === 0) return null

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#6B7280]">Recently Viewed</p>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.id}`}
            className="w-20 shrink-0 snap-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.images?.[0] ?? ''}
              alt={item.title}
              className="size-20 rounded-lg bg-[#F3F4F6] object-cover"
            />
            <p className="mt-1 line-clamp-1 text-xs text-[#374151]">{item.title}</p>
            <p className="text-xs font-semibold text-[#F36D21]">
              MMK {item.price.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
