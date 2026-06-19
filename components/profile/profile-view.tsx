'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockProfile } from '@/lib/mock/profile'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileListingCard } from '@/components/profile/profile-listing-card'

type ProfileTab = 'listings' | 'reviews' | 'about'

const tabs: { id: ProfileTab; label: string }[] = [
  { id: 'listings', label: 'Listings' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'about', label: 'About' },
]

export function ProfileView() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('listings')
  const profile = mockProfile

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 px-4 pt-5 text-sm text-[#6B7280] sm:px-6 md:px-8"
        >
          <Link
            href="/"
            className="transition-colors hover:text-[#2D2E32]"
          >
            Home
          </Link>
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          <span className="font-medium text-[#2D2E32]">Profile</span>
        </nav>

        <ProfileHeader profile={profile} />

        <div className="border-t border-[#E5E7EB] px-4 sm:px-6 md:px-8">
          <div
            role="tablist"
            aria-label="Profile sections"
            className="flex gap-6 overflow-x-auto"
          >
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
          {activeTab === 'listings' && (
            <div role="tabpanel" aria-label="Listings">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {profile.listings.map((listing) => (
                  <ProfileListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <button
                type="button"
                className="mt-8 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#2D2E32] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
              >
                View all listings
              </button>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div role="tabpanel" aria-label="Reviews" className="space-y-4">
              {profile.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-[#E5E7EB] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-[#2D2E32]">{review.author}</p>
                    <span className="text-xs text-[#9CA3AF]">{review.date}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          'size-4',
                          index < review.rating
                            ? 'fill-[#FBBF24] text-[#FBBF24]'
                            : 'fill-[#E5E7EB] text-[#E5E7EB]'
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div role="tabpanel" aria-label="About">
              <p className="max-w-2xl text-sm leading-relaxed text-[#6B7280] sm:text-base">
                {profile.about}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
