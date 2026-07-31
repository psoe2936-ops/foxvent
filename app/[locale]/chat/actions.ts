'use server'

import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, formatRetryTime } from '@/lib/rate-limit'

export async function sendMessage(data: {
  conversationId: string
  content: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const content = data.content.trim()
  if (!content) return { error: 'Message cannot be empty.' }
  if (content.length > 2000) return { error: 'Message is too long (max 2000 characters).' }

  // Verify sender is a participant in this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', data.conversationId)
    .single()

  if (!conversation) return { error: 'Conversation not found.' }
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    return { error: 'Not authorized.' }
  }

  // Server-side rate limit enforcement
  const rl = await checkRateLimit(supabase, user.id, 'send_message', 30, 1)
  if (!rl.allowed) {
    const wait = formatRetryTime(rl.retryAfterSeconds ?? 60)
    return { error: `You're messaging a bit fast — give it ${wait}!` }
  }

  const { error: insertError } = await supabase.from('messages').insert({
    conversation_id: data.conversationId,
    sender_id: user.id,
    content: sanitizeText(content, 2000),
    is_read: false,
  })

  if (insertError) return { error: 'Failed to send message. Please try again.' }

  return { success: true }
}

export async function sendImageMessage(data: {
  conversationId: string
  imageUrl: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // Verify sender is a participant in this conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id')
    .eq('id', data.conversationId)
    .single()

  if (!conv) return { error: 'Conversation not found.' }
  if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
    return { error: 'Not authorized.' }
  }

  // Server-side rate limit enforcement
  const rl = await checkRateLimit(supabase, user.id, 'send_image', 20, 10)
  if (!rl.allowed) {
    return {
      error: `Too many images. Try again in ${formatRetryTime(rl.retryAfterSeconds!)}.`,
    }
  }

  const { error: insertError } = await supabase.from('messages').insert({
    conversation_id: data.conversationId,
    sender_id: user.id,
    content: '',
    message_type: 'image',
    image_url: data.imageUrl,
  })

  if (insertError) return { error: 'Failed to send image. Please try again.' }

  return { success: true }
}
