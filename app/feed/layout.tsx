import { createClient } from '@/lib/supabase/server'
import { FeedSidebar } from '@/components/feed/sidebar'
import { FeedRightSidebar } from '@/components/feed/right-sidebar'
import type { TrendingItem } from '@/components/feed/trending-panel'
import type { ActivityNotification } from '@/components/feed/activity-panel'

function groupByCategory(products: any[]): TrendingItem[] {
  const map = new Map<string, { item: TrendingItem; viewSum: number }>()
  for (const p of products) {
    const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
    if (!cat) continue
    if (!map.has(cat.id)) {
      map.set(cat.id, {
        item: { id: cat.id, name: cat.name, icon: cat.icon ?? null, count: 0 },
        viewSum: 0,
      })
    }
    const entry = map.get(cat.id)!
    entry.item.count++
    entry.viewSum += p.views_count ?? 0
  }
  return Array.from(map.values())
    .sort((a, b) => b.viewSum - a.viewSum || b.item.count - a.item.count)
    .slice(0, 5)
    .map((e) => e.item)
}

export default async function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let viewerUsername: string | undefined
  let userLocation: string | undefined

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('username, location')
      .eq('id', user.id)
      .single()
    viewerUsername = data?.username ?? undefined
    userLocation = data?.location ?? undefined
  }

  // Trending: location-filtered first, fall back to overall
  let trendingItems: TrendingItem[] = []
  let trendingLabel = 'Most popular'

  if (userLocation) {
    const { data: locProds } = await supabase
      .from('products')
      .select('category_id, views_count, categories(id, name, icon)')
      .eq('status', 'approved')
      .ilike('location', `%${userLocation}%`)

    if (locProds && locProds.length > 0) {
      trendingItems = groupByCategory(locProds)
      trendingLabel = `In ${userLocation}`
    }
  }

  if (trendingItems.length === 0) {
    const { data: allProds } = await supabase
      .from('products')
      .select('category_id, views_count, categories(id, name, icon)')
      .eq('status', 'approved')

    trendingItems = groupByCategory(allProds ?? [])
  }

  // Recent activity: last 5 notifications for logged-in user
  let recentActivity: ActivityNotification[] = []
  if (user) {
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    recentActivity = (data as ActivityNotification[]) ?? []
  }

  return (
    <div className="w-full py-4 pb-10 lg:py-6">
      <div className="flex w-full items-start">
        <FeedSidebar username={viewerUsername} userId={user?.id} />
        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-10">
          {children}
        </div>
        <FeedRightSidebar
          trendingItems={trendingItems}
          trendingLabel={trendingLabel}
          recentActivity={recentActivity}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  )
}
