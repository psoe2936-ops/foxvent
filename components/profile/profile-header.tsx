import { Clock, Star } from 'lucide-react'
import type { MockProfile } from '@/lib/mock/profile'

type ProfileHeaderProps = {
  profile: MockProfile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div>
      <div className="relative h-36 overflow-hidden rounded-t-2xl sm:h-44 md:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.coverUrl}
          alt=""
          className="size-full object-cover"
        />
      </div>

      <div className="relative px-4 pb-6 sm:px-6 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="-mt-10 size-20 shrink-0 rounded-full border-4 border-white object-cover shadow-sm sm:-mt-12 sm:size-24"
            />

            <div className="min-w-0 pb-1">
              <h1 className="text-xl font-bold text-[#2D2E32] sm:text-2xl">
                {profile.fullName}
              </h1>
              <p className="mt-0.5 text-sm text-[#6B7280]">
                @{profile.username}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6B7280]">
                <span className="inline-flex items-center gap-1">
                  <Star
                    className="size-4 fill-[#FBBF24] text-[#FBBF24]"
                    aria-hidden="true"
                  />
                  <span>
                    {profile.rating} ({profile.reviewCount} reviews)
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden="true" />
                  <span>Member since {profile.memberSince}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-6 border-t border-[#E5E7EB] pt-4 md:border-t-0 md:pt-0 md:pb-2">
            <Stat value={profile.stats.listings} label="Listings" />
            <div className="h-10 w-px bg-[#E5E7EB]" aria-hidden="true" />
            <Stat value={profile.stats.sold} label="Sold" />
            <div className="h-10 w-px bg-[#E5E7EB]" aria-hidden="true" />
            <Stat value={profile.stats.responseRate} label="Response Rate" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center md:text-right">
      <p className="text-lg font-bold text-[#2D2E32] sm:text-xl">{value}</p>
      <p className="text-xs text-[#6B7280] sm:text-sm">{label}</p>
    </div>
  )
}
