'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type ProfileTab = 'listings' | 'reviews' | 'about'

type ProfileTabsProps = {
  listingsContent: ReactNode
  reviewsContent: ReactNode
  reviewCount: number
  aboutContent: ReactNode
}

export function ProfileTabs({
  listingsContent,
  reviewsContent,
  reviewCount,
  aboutContent,
}: ProfileTabsProps) {
  const t = useTranslations('profile')
  const [activeTab, setActiveTab] = useState<ProfileTab>('listings')

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'listings', label: t('listings') },
    { id: 'reviews', label: reviewCount > 0 ? t('reviewsWithCount', { count: reviewCount }) : t('reviews') },
    { id: 'about', label: t('about') },
  ]

  return (
    <div>
      <div className="border-t border-[#E5E7EB] px-4 sm:px-6 md:px-8">
        <div role="tablist" aria-label={t('profileSections')} className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative shrink-0 py-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30',
                activeTab === tab.id
                  ? 'text-[#F36D21]'
                  : 'text-[#6B7280] hover:text-[#2D2E32]'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#F36D21]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8">
        <div role="tabpanel" aria-label={t('listings')} hidden={activeTab !== 'listings'}>
          {listingsContent}
        </div>
        <div role="tabpanel" aria-label={t('reviews')} hidden={activeTab !== 'reviews'}>
          {reviewsContent}
        </div>
        <div role="tabpanel" aria-label={t('about')} hidden={activeTab !== 'about'}>
          {aboutContent}
        </div>
      </div>
    </div>
  )
}
