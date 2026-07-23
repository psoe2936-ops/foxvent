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
