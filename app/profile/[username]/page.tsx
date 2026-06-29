import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NavbarServer } from '@/components/navbar/navbar-server'
import { CoverPhotoUpload } from '@/components/profile/cover-photo-upload'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { FollowButton } from '@/components/profile/follow-button'
import { ProfileTabs } from '@/components/profile/profile-tabs'
import { ListingsSection } from '@/components/profile/listings-section'

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

  const { data: products } = await productsQuery

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, icon')
    .order('name')

  if (categoriesError) {
    console.error(
      `Failed to load categories: message="${categoriesError.message}" code="${categoriesError.code}" details="${categoriesError.details}" hint="${categoriesError.hint}"`
    )
  }

  // Follow counts
  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
  ])

  // Is the viewer following this profile? Does this profile follow the viewer back?
  let isFollowing = false
  let followsYouBack = false
  if (viewer && !isOwner) {
    const [{ data: followRow }, { data: reverseRow }] = await Promise.all([
      supabase
        .from('follows')
        .select('id')
        .eq('follower_id', viewer.id)
        .eq('following_id', profile.id)
        .maybeSingle(),
      supabase
        .from('follows')
        .select('id')
        .eq('follower_id', profile.id)
        .eq('following_id', viewer.id)
        .maybeSingle(),
    ])
    isFollowing = !!followRow
    followsYouBack = !!reverseRow
  }

  return (
    <>
      <NavbarServer />
      <main className="min-h-screen bg-[#F9FAFB]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <CoverPhotoUpload
              userId={profile.id}
              initialCoverUrl={profile.cover_url}
              isOwner={isOwner}
            />

            <div className="px-4 pb-5 sm:px-6 md:px-8">
              {/* Name row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <AvatarUpload
                    userId={profile.id}
                    initialAvatarUrl={profile.avatar_url}
                    fullName={profile.full_name}
                    isOwner={isOwner}
                  />

                  <div className="min-w-0 pb-1">
                    <h1 className="text-xl font-bold text-[#2D2E32] sm:text-2xl">
                      {profile.full_name}
                    </h1>
                    <p className="mt-0.5 text-sm text-[#6B7280]">@{profile.username}</p>
                    {profile.location && (
                      <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#6B7280]">
                        <MapPin className="size-4" aria-hidden="true" />
                        {profile.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 pb-1">
                  {isOwner ? (
                    <EditProfileModal profile={profile} />
                  ) : (
                    <FollowButton
                      targetUserId={profile.id}
                      viewerId={viewer?.id ?? null}
                      initialFollowing={isFollowing}
                      followerCount={followerCount ?? 0}
                      followsYouBack={followsYouBack}
                    />
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-5 flex items-center gap-6 border-t border-[#F3F4F6] pt-4">
                <div className="text-center">
                  <p className="text-base font-semibold text-[#1F2937]">
                    {products?.length ?? 0}
                  </p>
                  <p className="text-xs text-[#6B7280]">Listings</p>
                </div>

                {isOwner && (
                  <Link
                    href={`/profile/${profile.username}/followers`}
                    className="text-center transition-opacity hover:opacity-70"
                  >
                    <p className="text-base font-semibold text-[#1F2937]">
                      {followerCount ?? 0}
                    </p>
                    <p className="text-xs text-[#6B7280]">Followers</p>
                  </Link>
                )}

                <Link
                  href={`/profile/${profile.username}/following`}
                  className="text-center transition-opacity hover:opacity-70"
                >
                  <p className="text-base font-semibold text-[#1F2937]">
                    {followingCount ?? 0}
                  </p>
                  <p className="text-xs text-[#6B7280]">Following</p>
                </Link>
              </div>
            </div>

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
                <ProfileAbout bio={profile.bio} location={profile.location} />
              }
            />
          </div>
        </div>
      </main>
    </>
  )
}

function ProfileAbout({
  bio,
  location,
}: {
  bio: string | null
  location: string | null
}) {
  if (!bio && !location) {
    return <p className="text-sm text-[#6B7280]">No information added yet.</p>
  }

  return (
    <div className="max-w-2xl space-y-3">
      {bio && (
        <p className="text-sm leading-relaxed text-[#6B7280] sm:text-base">{bio}</p>
      )}
      {location && (
        <p className="inline-flex items-center gap-1 text-sm text-[#6B7280]">
          <MapPin className="size-4" aria-hidden="true" />
          {location}
        </p>
      )}
    </div>
  )
}
