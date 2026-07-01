'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function MessageSellerButton({
  productId,
  sellerId,
}: {
  productId: string
  sellerId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)

    // 1. Check the user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/?login=1')
      return
    }

    // 2. Can't message yourself
    if (user.id === sellerId) {
      setLoading(false)
      return
    }

    // 3. Look for an existing conversation for this buyer + product
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', user.id)
      .maybeSingle()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      return
    }

    // 4. None exists — create one
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        product_id: productId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to start conversation:', error)
      setLoading(false)
      return
    }

    router.push(`/chat/${created.id}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
    >
      {loading ? 'Opening chat…' : 'Message seller'}
    </button>
  )
}