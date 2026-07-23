'use server'

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, formatRetryTime } from '@/lib/rate-limit'

export type Offer = {
  id: string
  product_id: string
  conversation_id: string
  buyer_id: string
  seller_id: string
  amount: number
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired'
  parent_offer_id: string | null
  created_at: string
  responded_at: string | null
}

export async function makeOffer(data: {
  conversationId: string
  amount: number
}): Promise<{ error: string } | { success: true; offer: Offer }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const amount = Math.floor(data.amount)
  if (!Number.isInteger(amount) || amount <= 0 || amount > 999_999_999) {
    return { error: 'Enter a valid offer amount (1 – 999,999,999).' }
  }

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id, product_id')
    .eq('id', data.conversationId)
    .single()

  if (!conv) return { error: 'Conversation not found.' }
  if (conv.buyer_id !== user.id) return { error: 'Only the buyer can make an offer.' }

  const rl = await checkRateLimit(supabase, user.id, 'make_offer', 10, 60)
  if (!rl.allowed) {
    return { error: `Too many offers. Try again in ${formatRetryTime(rl.retryAfterSeconds!)}.` }
  }

  const { data: offer, error: dbErr } = await supabase
    .from('offers')
    .insert({
      product_id: conv.product_id,
      conversation_id: data.conversationId,
      buyer_id: user.id,
      seller_id: conv.seller_id,
      amount,
      status: 'pending',
    })
    .select()
    .single()

  if (dbErr || !offer) return { error: 'Failed to submit offer. Please try again.' }
  return { success: true, offer: offer as Offer }
}

export async function respondToOffer(data: {
  offerId: string
  action: 'accepted' | 'rejected' | 'countered'
  counterAmount?: number
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  if (!['accepted', 'rejected', 'countered'].includes(data.action)) {
    return { error: 'Invalid action.' }
  }

  const { data: offer } = await supabase
    .from('offers')
    .select('id, seller_id, buyer_id, conversation_id, product_id, status')
    .eq('id', data.offerId)
    .single()

  if (!offer) return { error: 'Offer not found.' }
  if (offer.seller_id !== user.id) return { error: 'Not authorized.' }
  if (offer.status !== 'pending') return { error: 'This offer is no longer pending.' }

  const now = new Date().toISOString()

  if (data.action === 'countered') {
    const counterAmount = Math.floor(data.counterAmount ?? 0)
    if (!Number.isInteger(counterAmount) || counterAmount <= 0 || counterAmount > 999_999_999) {
      return { error: 'Enter a valid counter amount (1 – 999,999,999).' }
    }

    await supabase
      .from('offers')
      .update({ status: 'countered', responded_at: now })
      .eq('id', data.offerId)

    const { error: insertErr } = await supabase.from('offers').insert({
      product_id: offer.product_id,
      conversation_id: offer.conversation_id,
      buyer_id: offer.buyer_id,
      seller_id: offer.seller_id,
      amount: counterAmount,
      status: 'pending',
      parent_offer_id: data.offerId,
    })

    if (insertErr) return { error: 'Failed to submit counter offer.' }
    return { success: true }
  }

  const { error: updateErr } = await supabase
    .from('offers')
    .update({ status: data.action, responded_at: now })
    .eq('id', data.offerId)

  if (updateErr) return { error: 'Failed to update offer.' }
  return { success: true }
}
