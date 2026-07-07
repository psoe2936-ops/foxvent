'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function MakeOfferButton({
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/?login=1')
      return
    }

    if (user.id === sellerId) {
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', user.id)
      .maybeSingle()

    if (existing) {
      router.push(`/chat/${existing.id}?offer=1`)
      return
    }

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
      setLoading(false)
      return
    }

    router.push(`/chat/${created.id}?offer=1`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-lg border border-[#F36D21] px-4 py-2.5 text-sm font-semibold text-[#F36D21] hover:bg-[#FEF3E2] disabled:opacity-60"
    >
      {loading ? 'Opening chat…' : 'Make an offer'}
    </button>
  )
}
