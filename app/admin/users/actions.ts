'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/audit-log'

type BanDuration = '24h' | '7d' | '30d' | 'permanent'
const ALLOWED_DURATIONS = new Set<BanDuration>(['24h', '7d', '30d', 'permanent'])

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') throw new Error('Not authorized')
  return { supabase, user }
}

export async function banUser(
  userId: string,
  duration: BanDuration,
  reason: string
): Promise<{ error: string } | { success: true }> {
  if (!ALLOWED_DURATIONS.has(duration)) {
    return { error: 'Invalid ban duration.' }
  }
  const trimmedReason = reason.trim()
  if (!trimmedReason || trimmedReason.length < 10) {
    return { error: 'Ban reason must be at least 10 characters.' }
  }
  if (trimmedReason.length > 500) {
    return { error: 'Ban reason must be 500 characters or fewer.' }
  }

  const { supabase, user } = await verifyAdmin()

  const bannedUntil: string | null =
    duration === '24h'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : duration === '7d'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : duration === '30d'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null

  const { error, count } = await supabase
    .from('users')
    .update(
      { is_banned: true, banned_until: bannedUntil, ban_reason: trimmedReason },
      { count: 'exact' }
    )
    .eq('id', userId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Ban failed — no rows affected. Check permissions.' }

  const durationLabel: Record<BanDuration, string> = {
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
    permanent: 'permanently',
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'product_rejected',
    title: 'Your account has been restricted',
    body: `Reason: ${trimmedReason}. Duration: ${durationLabel[duration]}.`,
    link: '/settings',
  })

  await logAdminAction(supabase, user.id, 'ban_user', 'user', userId, {
    duration,
    reason: trimmedReason,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function unbanUser(
  userId: string
): Promise<{ error: string } | { success: true }> {
  const { supabase, user } = await verifyAdmin()
  const { error, count } = await supabase
    .from('users')
    .update(
      { is_banned: false, banned_until: null, ban_reason: null },
      { count: 'exact' }
    )
    .eq('id', userId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Unban failed — no rows affected. Check permissions.' }

  await logAdminAction(supabase, user.id, 'unban_user', 'user', userId)

  revalidatePath('/admin/users')
  return { success: true }
}
