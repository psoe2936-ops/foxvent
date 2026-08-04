'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/audit-log'

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

  if (!profile || profile.role !== 'admin') {
    throw new Error('Not authorized')
  }

  return { supabase, user }
}

export async function dismissUserReport(
  reportId: string
): Promise<{ error: string } | { success: true }> {
  const { supabase, user } = await verifyAdmin()

  const { error, count } = await supabase
    .from('user_reports')
    .update({ status: 'dismissed' }, { count: 'exact' })
    .eq('id', reportId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Dismiss failed — no rows affected. Check permissions.' }

  await logAdminAction(supabase, user.id, 'dismiss_user_report', 'user_report', reportId)

  revalidatePath('/admin/user-reports')
  return { success: true }
}
