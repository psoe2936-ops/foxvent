'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  targetUserId: string
  viewerId: string | null
  initialFollowing: boolean
  followerCount?: number
  followsYouBack?: boolean
}

export function FollowButton({
  targetUserId,
  viewerId,
  initialFollowing,
  followerCount,
  followsYouBack = false,
}: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(followerCount ?? 0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (viewerId === targetUserId) return null

  async function handleClick() {
    if (!viewerId) {
      router.push('/?login=1')
      return
    }

    const supabase = createClient()
    const next = !following

    setFollowing(next)
    if (followerCount !== undefined) setCount((c) => (next ? c + 1 : c - 1))
    setLoading(true)

    try {
      if (next) {
        const { error } = await supabase.from('follows').insert({
          follower_id: viewerId,
          following_id: targetUserId,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', viewerId)
          .eq('following_id', targetUserId)
        if (error) throw error
      }
    } catch {
      setFollowing(!next)
      if (followerCount !== undefined) setCount((c) => (next ? c - 1 : c + 1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
            following
              ? 'bg-[#F36D21] text-white hover:opacity-90'
              : 'border border-[#E5E7EB] text-[#1F2937] hover:bg-[#F9FAFB]'
          }`}
        >
          {following && <Check className="size-3.5" strokeWidth={2.5} />}
          {following ? 'Following' : 'Follow'}
        </button>

        {followerCount !== undefined && (
          <span className="text-sm text-[#6B7280]">
            <span className="font-semibold text-[#1F2937]">{count}</span>{' '}
            follower{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {followsYouBack && (
        <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#6B7280]">
          Follows you back
        </span>
      )}
    </div>
  )
}
