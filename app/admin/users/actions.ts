'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type BanDuration = '24h' | '7d' | '30d' | 'permanent'

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
  return supabase
}

export async function banUser(userId: string, duration: BanDuration, reason: string) {
  const supabase = await verifyAdmin()

  const bannedUntil: string | null =
    duration === '24h'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : duration === '7d'
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : duration === '30d'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null

  await supabase
    .from('users')
    .update({ is_banned: true, banned_until: bannedUntil, ban_reason: reason })
    .eq('id', userId)

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
    body: `Reason: ${reason}. Duration: ${durationLabel[duration]}.`,
    link: '/settings',
  })

  revalidatePath('/admin/users')
}

export async function unbanUser(userId: string) {
  const supabase = await verifyAdmin()
  await supabase
    .from('users')
    .update({ is_banned: false, banned_until: null, ban_reason: null })
    .eq('id', userId)
  revalidatePath('/admin/users')
}
