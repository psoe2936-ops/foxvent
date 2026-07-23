import Link from 'next/link'
import { FollowButton } from '@/components/profile/follow-button'

type UserCardProps = {
  id: string
  username: string
  fullName: string | null
  avatarUrl: string | null
  listingCount: number
  isFollowing: boolean
  viewerId: string | null
}

export function UserCard({
  id,
  username,
  fullName,
  avatarUrl,
  listingCount,
  isFollowing,
  viewerId,
}: UserCardProps) {
  const displayName = fullName ?? username
  const initial = (displayName[0] ?? '?').toUpperCase()

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center">
      <Link
        href={`/profile/${username}`}
        className="group flex flex-col items-center gap-2"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-12 rounded-full bg-[#F3F4F6] object-cover ring-2 ring-[#E5E7EB]"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-[#F3F4F6] text-sm font-semibold text-[#6B7280] ring-2 ring-[#E5E7EB]">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1F2937] group-hover:text-[#F36D21] transition-colors">
            {displayName}
          </p>
          <p className="text-xs text-[#6B7280]">@{username}</p>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {listingCount} listing{listingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </Link>

      <FollowButton
        targetUserId={id}
        viewerId={viewerId}
        initialFollowing={isFollowing}
      />
    </div>
  )
}
