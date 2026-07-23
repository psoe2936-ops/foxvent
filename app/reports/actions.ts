'use server'

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, formatRetryTime } from '@/lib/rate-limit'

const ALLOWED_PRODUCT_REASONS = new Set([
  'Spam',
  'Fake listing',
  'Inappropriate content',
  'Wrong price',
  'Already sold',
  'Other',
])

const ALLOWED_USER_REASONS = new Set([
  'scam_or_fraud',
  'harassment',
  'fake_profile',
  'inappropriate_behavior',
  'payment_dispute',
  'other',
])

export async function submitProductReport(data: {
  productId: string
  reason: string
  description: string | null
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to report a listing.' }

  if (!ALLOWED_PRODUCT_REASONS.has(data.reason)) return { error: 'Invalid reason selected.' }

  const description = data.description?.trim() || null

  const rl = await checkRateLimit(supabase, user.id, 'report_product', 5, 60)
  if (!rl.allowed) {
    const wait = formatRetryTime(rl.retryAfterSeconds ?? 3600)
    return { error: `You've submitted quite a few reports recently — give it ${wait} before sending another.` }
  }

  const { error: insertError } = await supabase.from('reports').insert({
    reporter_id: user.id,
    product_id: data.productId,
    reason: data.reason,
    description,
    status: 'pending',
  })

  if (insertError) {
    if (insertError.code === '23505') return { error: 'You have already reported this listing.' }
    return { error: 'Failed to submit report. Please try again.' }
  }

  return { success: true }
}

export async function submitUserReport(data: {
  reportedUserId: string
  reason: string
  description: string
  conversationId?: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to report a user.' }

  if (!ALLOWED_USER_REASONS.has(data.reason)) return { error: 'Invalid reason selected.' }

  const description = data.description.trim()
  if (description.length < 20) return { error: 'Description must be at least 20 characters.' }
  if (description.length > 2000) return { error: 'Description must be 2000 characters or fewer.' }

  const rl = await checkRateLimit(supabase, user.id, 'report_user', 5, 60)
  if (!rl.allowed) {
    const wait = formatRetryTime(rl.retryAfterSeconds ?? 3600)
    return { error: `You've submitted quite a few reports recently — give it ${wait} before sending another.` }
  }

  const { error: insertError } = await supabase.from('user_reports').insert({
    reporter_id: user.id,
    reported_user_id: data.reportedUserId,
    reason: data.reason,
    description,
    ...(data.conversationId ? { conversation_id: data.conversationId } : {}),
  })

  if (insertError) return { error: 'Failed to submit report. Please try again.' }

  return { success: true }
}
