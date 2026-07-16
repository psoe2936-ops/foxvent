import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StarRatingDisplay } from '@/components/reviews/star-rating-display'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { CoverPhotoUpload } from '@/components/profile/cover-photo-upload'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { FollowButton } from '@/components/profile/follow-button'
import { ProfileTabs } from '@/components/profile/profile-tabs'
import { ListingsSection } from '@/components/profile/listings-section'
import { ExpandableBio } from '@/components/profile/expandable-bio'
import { FeedSidebar } from '@/components/feed/sidebar'
import { SellPromoCard } from '@/components/feed/sell-promo-card'
import { HelpPromoCard } from '@/components/feed/help-promo-card'
import { UserSafetyMenu } from '@/components/users/user-safety-menu'

type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: { username: string; full_name: string | null; avatar_url: string | null } | { username: string; full_name: string | null; avatar_url: string | null }[] | null
  products: { title: string } | { title: string }[] | null
}

type ProfilePageProps = {
  params: Promise<{ username: string }>
  searchParams: Promise<{ new?: string }>
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

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params
  const { new: newParam } = await searchParams
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
    { data: rawReviews },
  ] = await Promise.all([
    productsQuery,
    supabase.from('categories').select('id, name, icon').order('name'),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', profile.id).eq('status', 'approved'),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:reviewer_id(username, full_name, avatar_url), products(title)')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false }),
  ])

  const reviews = (rawReviews ?? []) as ReviewRow[]
  const reviewCount = reviews.length
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : null

  if (categoriesError) {
    console.error(`Failed to load categories: ${categoriesError.message}`)
  }

  let isFollowing = false
  let followsYouBack = false
  let isBlocked = false
  if (viewer && !isOwner) {
    const [{ data: followRow }, { data: reverseRow }, { data: blockRow }] = await Promise.all([
      supabase.from('follows').select('id').eq('follower_id', viewer.id).eq('following_id', profile.id).maybeSingle(),
      supabase.from('follows').select('id').eq('follower_id', profile.id).eq('following_id', viewer.id).maybeSingle(),
      supabase.from('blocks').select('id').eq('blocker_id', viewer.id).eq('blocked_id', profile.id).maybeSingle(),
    ])
    isFollowing = !!followRow
    followsYouBack = !!reverseRow
    isBlocked = !!blockRow
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const isVerifiedSeller = (approvedCount ?? 0) >= 5

  return (
    <div className="w-full pb-24 lg:pb-10">
      <div className="flex w-full items-start">
        {/* Left sidebar */}
        <FeedSidebar userId={viewer?.id} />

        {/* Center — cover photo goes full-width, content gets padding */}
        <div className="min-w-0 flex-1">
          <CoverPhotoUpload
            userId={profile.id}
            initialCoverUrl={profile.cover_url}
            isOwner={isOwner}
          />

          <div className="px-4 sm:px-6 lg:px-8">
            {/* Avatar + Edit/Follow button row */}
            <div className="flex items-start justify-between gap-4">
              <AvatarUpload
                userId={profile.id}
                initialAvatarUrl={profile.avatar_url}
                fullName={profile.full_name ?? profile.username}
                isOwner={isOwner}
              />
              <div className="mt-3 flex shrink-0 items-center gap-2">
                {isOwner ? (
                  <EditProfileModal profile={profile} />
                ) : (
                  <>
                    <FollowButton
                      targetUserId={profile.id}
                      viewerId={viewer?.id ?? null}
                      initialFollowing={isFollowing}
                      followerCount={followerCount ?? 0}
                    />
                    {viewer && (
                      <UserSafetyMenu
                        targetUserId={profile.id}
                        targetUsername={profile.username}
                        viewerId={viewer.id}
                        initialBlocked={isBlocked}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Name + bio + location + trust signals */}
            <div className="mt-3">
              <h1 className="text-xl font-bold text-[#1F2937] sm:text-2xl">
                {profile.full_name ?? profile.username}
              </h1>
              <p className="mt-0.5 text-sm text-[#6B7280]">@{profile.username}</p>

              {profile.bio && (
                <div className="mt-2">
                  <ExpandableBio bio={profile.bio} />
                </div>
              )}

              {profile.location && (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#6B7280]">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />
                  {profile.location}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {isVerifiedSeller && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <ShieldCheck className="size-3.5" />
                    Verified seller
                  </span>
                )}
                <span className="text-xs text-[#9CA3AF]">Member since {memberSince}</span>
              </div>

              {avgRating !== null && reviewCount > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRatingDisplay rating={avgRating} size="sm" showNumber />
                  <span className="text-xs text-[#9CA3AF]">
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {!isOwner && followsYouBack && (
                <span className="mt-2 inline-block rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs text-[#6B7280]">
                  Follows you back
                </span>
              )}
            </div>

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

            {/* Tabs — ListingsSection contains the "+ New listing" button for owners */}
            <div className="mt-6">
              <ProfileTabs
                reviewCount={reviewCount}
                listingsContent={
                  <ListingsSection
                    userId={profile.id}
                    categories={categories ?? []}
                    initialProducts={products ?? []}
                    isOwner={isOwner}
                    sellerUsername={profile.username}
                    initialModalOpen={isOwner && newParam === '1'}
                  />
                }
                reviewsContent={
                  <ReviewsSection reviews={reviews} />
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
        </div>

        {/* Right sidebar */}
        <aside className="scrollbar-none sticky top-20 hidden h-[calc(100vh-5rem)] w-75 shrink-0 flex-col overflow-y-auto border-l border-[#E8EAED] bg-[#F9FAFB] py-6 pl-4 pr-5 xl:flex xl:pr-6">
          <div className="space-y-6">
            <SellPromoCard />
            <HelpPromoCard />
          </div>
        </aside>
      </div>
    </div>
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

function ReviewsSection({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[#9CA3AF]">No reviews yet.</p>
    )
  }

  return (
    <div className="max-w-xl divide-y divide-[#E5E7EB]">
      {reviews.map((review) => {
        const reviewer = Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer
        const product = Array.isArray(review.products) ? review.products[0] : review.products
        const initials = (reviewer?.full_name?.[0] ?? reviewer?.username?.[0] ?? '?').toUpperCase()

        return (
          <div key={review.id} className="py-4 first:pt-0">
            <div className="flex items-start gap-3">
              {reviewer?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reviewer.avatar_url}
                  alt=""
                  className="size-8 shrink-0 rounded-full bg-[#F3F4F6] object-cover"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-xs font-semibold text-[#6B7280]">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[#1F2937]">
                    {reviewer?.full_name ?? `@${reviewer?.username}`}
                  </span>
                  <StarRatingDisplay rating={review.rating} size="sm" />
                  <span className="text-xs text-[#9CA3AF]">
                    {formatRelativeTime(review.created_at)}
                  </span>
                </div>

                {product?.title && (
                  <p className="mt-0.5 text-xs text-[#9CA3AF]">for {product.title}</p>
                )}

                {review.comment && (
                  <p className="mt-1.5 text-sm leading-relaxed text-[#4B5563]">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
