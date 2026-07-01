import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CoverPhotoUpload } from '@/components/profile/cover-photo-upload'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { FollowButton } from '@/components/profile/follow-button'
import { ProfileTabs } from '@/components/profile/profile-tabs'
import { ListingsSection } from '@/components/profile/listings-section'
import { ExpandableBio } from '@/components/profile/expandable-bio'

type ProfilePageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, bio, avatar_url')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Profile not found' }

  const title = profile.full_name ? `${profile.full_name} (@${username})` : `@${username}`
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `View ${profile.full_name ?? username}'s listings on FoxVent.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      ...(profile.avatar_url ? { images: [{ url: profile.avatar_url }] } : {}),
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url, cover_url, bio, location, created_at')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  const isOwner = viewer?.id === profile.id

  let productsQuery = supabase
    .from('products')
    .select('id, title, description, price, images, condition, category_id, location, status, is_sold')
    .eq('seller_id', profile.id)
    .order('created_at', { ascending: false })

  if (!isOwner) {
    productsQuery = productsQuery.eq('status', 'approved')
  }

  const [
    { data: products },
    { data: categories, error: categoriesError },
    { count: followerCount },
    { count: followingCount },
    { count: approvedCount },
  ] = await Promise.all([
    productsQuery,
    supabase.from('categories').select('id, name, icon').order('name'),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', profile.id).eq('status', 'approved'),
  ])

  if (categoriesError) {
    console.error(`Failed to load categories: ${categoriesError.message}`)
  }

  let isFollowing = false
  let followsYouBack = false
  if (viewer && !isOwner) {
    const [{ data: followRow }, { data: reverseRow }] = await Promise.all([
      supabase.from('follows').select('id').eq('follower_id', viewer.id).eq('following_id', profile.id).maybeSingle(),
      supabase.from('follows').select('id').eq('follower_id', profile.id).eq('following_id', viewer.id).maybeSingle(),
    ])
    isFollowing = !!followRow
    followsYouBack = !!reverseRow
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const isVerifiedSeller = (approvedCount ?? 0) >= 5

  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-24 md:pb-10">
      <CoverPhotoUpload
        userId={profile.id}
        initialCoverUrl={profile.cover_url}
        isOwner={isOwner}
      />

      {/* Profile content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Avatar row — AvatarUpload has -mt-12 sm:-mt-16 built in for overlap */}
        <div className="flex items-start justify-between gap-4">
          <AvatarUpload
            userId={profile.id}
            initialAvatarUrl={profile.avatar_url}
            fullName={profile.full_name ?? profile.username}
            isOwner={isOwner}
          />
          {/* Follow / Edit button — push down so it clears the cover bottom */}
          <div className="mt-3 shrink-0">
            {isOwner ? (
              <EditProfileModal profile={profile} />
            ) : (
              <FollowButton
                targetUserId={profile.id}
                viewerId={viewer?.id ?? null}
                initialFollowing={isFollowing}
                followerCount={followerCount ?? 0}
              />
            )}
          </div>
        </div>

        {/* Name + info */}
        <div className="mt-3">
          <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">
            {profile.full_name ?? profile.username}
          </h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">@{profile.username}</p>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-2">
              <ExpandableBio bio={profile.bio} />
            </div>
          )}

          {/* Location */}
          {profile.location && (
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#6B7280]">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {profile.location}
            </p>
          )}

          {/* Trust signals */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {isVerifiedSeller && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <ShieldCheck className="size-3.5" />
                Verified seller
              </span>
            )}
            <span className="text-xs text-[#9CA3AF]">Member since {memberSince}</span>
          </div>

          {/* Follows you back badge */}
          {!isOwner && followsYouBack && (
            <span className="mt-2 inline-block rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-[#6B7280]">
              Follows you back
            </span>
          )}

          {/* Stats row */}
          <div className="mt-5 flex items-center divide-x divide-[#E5E7EB] border-t border-[#E5E7EB] pt-4">
            <div className="pr-6 text-center">
              <p className="text-lg font-bold text-[#1F2937]">{products?.length ?? 0}</p>
              <p className="text-xs text-[#6B7280]">Listings</p>
            </div>
            <Link
              href={`/profile/${profile.username}/followers`}
              className="px-6 text-center transition-opacity hover:opacity-70"
            >
              <p className="text-lg font-bold text-[#1F2937]">{followerCount ?? 0}</p>
              <p className="text-xs text-[#6B7280]">Followers</p>
            </Link>
            <Link
              href={`/profile/${profile.username}/following`}
              className="px-6 text-center transition-opacity hover:opacity-70"
            >
              <p className="text-lg font-bold text-[#1F2937]">{followingCount ?? 0}</p>
              <p className="text-xs text-[#6B7280]">Following</p>
            </Link>
          </div>

          {/* Owner action buttons */}
          {isOwner && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/products/new"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-[#F36D21] text-sm font-semibold text-white hover:opacity-90 sm:w-auto sm:px-6"
              >
                + New listing
              </Link>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <ProfileTabs
            listingsContent={
              <ListingsSection
                userId={profile.id}
                categories={categories ?? []}
                initialProducts={products ?? []}
                isOwner={isOwner}
                sellerUsername={profile.username}
              />
            }
            aboutContent={
              <ProfileAbout
                bio={profile.bio}
                location={profile.location}
                memberSince={memberSince}
                approvedCount={approvedCount ?? 0}
              />
            }
          />
        </div>
      </div>
    </main>
  )
}

function ProfileAbout({
  bio,
  location,
  memberSince,
  approvedCount,
}: {
  bio: string | null
  location: string | null
  memberSince: string
  approvedCount: number
}) {
  return (
    <div className="max-w-xl space-y-4">
      {bio && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Bio</p>
          <p className="text-sm leading-relaxed text-[#4B5563]">{bio}</p>
        </div>
      )}

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3">
        {location && (
          <div className="flex items-center gap-2 text-sm text-[#4B5563]">
            <MapPin className="size-4 shrink-0 text-[#9CA3AF]" />
            {location}
          </div>
        )}
        <div className="text-sm text-[#4B5563]">
          <span className="text-[#9CA3AF]">Member since </span>
          {memberSince}
        </div>
        <div className="text-sm text-[#4B5563]">
          <span className="text-[#9CA3AF]">Approved listings </span>
          {approvedCount}
        </div>
      </div>

      {!bio && !location && (
        <p className="text-sm text-[#6B7280]">No information added yet.</p>
      )}
    </div>
  )
}
