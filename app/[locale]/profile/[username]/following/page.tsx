import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavbarServer } from '@/components/navbar/navbar-server'
import { FollowButton } from '@/components/profile/follow-button'

type Props = { params: Promise<{ username: string }> }

export default async function FollowingPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: followRows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', profile.id)
    .order('created_at', { ascending: false })

  const followingIds = (followRows ?? []).map((r: { following_id: string }) => r.following_id)

  let followingUsers: any[] = []
  if (followingIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .in('id', followingIds)
    const map = new Map((data ?? []).map((u: any) => [u.id, u]))
    followingUsers = followingIds.map((id) => map.get(id)).filter(Boolean)
  }

  let viewerFollows = new Set<string>()
  if (viewer && followingIds.length > 0) {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', viewer.id)
      .in('following_id', followingIds)
    viewerFollows = new Set((data ?? []).map((r: { following_id: string }) => r.following_id))
  }

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href={`/profile/${username}`}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2937]"
        >
          <ArrowLeft className="size-4" />
          Back to profile
        </Link>

        <h1 className="text-xl font-bold text-[#1F2937]">
          Following
          <span className="ml-2 text-base font-normal text-[#6B7280]">@{username}</span>
        </h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          {followingUsers.length} following
        </p>

        {followingUsers.length === 0 ? (
          <p className="mt-8 text-sm text-[#9CA3AF]">Not following anyone yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-[#F3F4F6] rounded-2xl border border-[#E5E7EB] bg-white">
            {followingUsers.map((user: any) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5"
              >
                <Link
                  href={`/profile/${user.username}`}
                  className="flex min-w-0 items-center gap-3 hover:opacity-80"
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="size-10 shrink-0 rounded-full bg-[#F3F4F6] object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E5E7EB] text-sm font-semibold text-[#6B7280]">
                      {(user.full_name?.[0] ?? user.username?.[0] ?? '?').toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#1F2937]">{user.full_name}</p>
                    <p className="truncate text-sm text-[#6B7280]">@{user.username}</p>
                  </div>
                </Link>

                <FollowButton
                  targetUserId={user.id}
                  viewerId={viewer?.id ?? null}
                  initialFollowing={viewerFollows.has(user.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
