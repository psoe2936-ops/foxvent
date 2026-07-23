'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

type MessageButtonProps = {
  viewerId: string
  profileId: string
}

export function MessageButton({ viewerId, profileId }: MessageButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleMessage() {
    setLoading(true)
    try {
      // Check if a direct conversation already exists (product_id is null)
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .is('product_id', null)
        .or(
          `and(buyer_id.eq.${viewerId},seller_id.eq.${profileId}),and(buyer_id.eq.${profileId},seller_id.eq.${viewerId})`
        )
        .maybeSingle()

      if (existing) {
        router.push(`/chat/${existing.id}`)
        return
      }

      // Create a new direct conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          buyer_id: viewerId,
          seller_id: profileId,
          product_id: null,
        })
        .select('id')
        .single()

      if (error || !newConv) {
        console.error('Failed to create conversation:', error)
        return
      }

      router.push(`/chat/${newConv.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleMessage}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB] disabled:opacity-60"
    >
      <MessageCircle className="size-4" />
      {loading ? 'Opening...' : 'Message'}
    </button>
  )
}