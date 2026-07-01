'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function WishlistHeart({
  productId,
  initialSaved = false,
}: {
  productId: string
  initialSaved?: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (pending) return
    setPending(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/?login=1')
      return
    }

    // Optimistic toggle
    const wasSaved = saved
    setSaved(!wasSaved)

    if (wasSaved) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) {
        console.error('Failed to remove from wishlist:', error)
        setSaved(true) // revert
      }
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: productId })

      if (error) {
        console.error('Failed to add to wishlist:', error)
        setSaved(false) // revert
      }
    }

    setPending(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors ${
        saved ? 'text-[#F36D21]' : 'text-[#6B7280] hover:text-[#F36D21]'
      }`}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
    >
      <Heart className="size-4" fill={saved ? '#F36D21' : 'none'} />
    </button>
  )
}