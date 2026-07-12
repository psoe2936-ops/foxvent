import { ActivityPanel, type ActivityNotification } from '@/components/feed/activity-panel'
import { HelpPromoCard } from '@/components/feed/help-promo-card'
import { SellPromoCard } from '@/components/feed/sell-promo-card'
import { TrendingPanel, type TrendingItem } from '@/components/feed/trending-panel'

type FeedRightSidebarProps = {
  trendingItems: TrendingItem[]
  trendingLabel: string
  recentActivity: ActivityNotification[]
  isLoggedIn: boolean
}

export function FeedRightSidebar({
  trendingItems,
  trendingLabel,
  recentActivity,
  isLoggedIn,
}: FeedRightSidebarProps) {
  return (
    <aside className="scrollbar-none sticky top-20 hidden h-[calc(100vh-5rem)] w-[300px] shrink-0 flex-col overflow-y-auto border-l border-white/40 bg-white/60 py-6 pl-4 pr-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl xl:flex xl:pr-6">
      <div className="space-y-6">
        <TrendingPanel items={trendingItems} label={trendingLabel} />
        <SellPromoCard />
        <ActivityPanel notifications={recentActivity} isLoggedIn={isLoggedIn} />
        <HelpPromoCard />
      </div>
    </aside>
  )
}
