import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatInboxContent } from '@/components/chat/chat-inbox-content'
import { FeedSidebar } from '@/components/feed/sidebar'
import { TrendingPanel, type TrendingItem } from '@/components/feed/trending-panel'

export default async function ChatInboxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1')

  const { data: trendingProds } = await supabase
    .from('products')
    .select('category_id, views_count, categories(id, name, icon)')
    .eq('status', 'approved')

  const trendingItems: TrendingItem[] = (() => {
    const map = new Map<string, { item: TrendingItem; viewSum: number }>()
    for (const p of trendingProds ?? []) {
      const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
      if (!cat) continue
      const key = (cat as { id: string }).id
      if (!map.has(key)) {
        map.set(key, {
          item: {
            id: key,
            name: (cat as { name: string }).name,
            icon: (cat as { icon: string | null }).icon ?? null,
            count: 0,
          },
          viewSum: 0,
        })
      }
      const entry = map.get(key)!
      entry.item.count++
      entry.viewSum += (p as { views_count?: number }).views_count ?? 0
    }
    return Array.from(map.values())
      .sort((a, b) => b.viewSum - a.viewSum || b.item.count - a.item.count)
      .slice(0, 5)
      .map((e) => e.item)
  })()

  return (
    <div className="w-full py-4 pb-24 lg:py-6 lg:pb-10">
      <div className="flex w-full items-start">
        <FeedSidebar userId={user.id} />

        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-10">
          <ChatInboxContent userId={user.id} />
        </div>

        <aside className="scrollbar-none sticky top-20 hidden h-[calc(100vh-5rem)] w-75 shrink-0 flex-col overflow-y-auto border-l border-[#E8EAED] bg-[#F9FAFB] py-6 pl-4 pr-5 xl:flex xl:pr-6">
          <TrendingPanel items={trendingItems} label="Most popular" />
        </aside>
      </div>
    </div>
  )
}
