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

export async function dismissReport(
  reportId: string
): Promise<{ error: string } | { success: true }> {
  const { supabase, user } = await verifyAdmin()

  const { error, count } = await supabase
    .from('reports')
    .update({ status: 'dismissed' }, { count: 'exact' })
    .eq('id', reportId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Dismiss failed — no rows affected. Check permissions.' }

  await logAdminAction(supabase, user.id, 'dismiss_report', 'report', reportId)

  revalidatePath('/admin/reports')
  return { success: true }
}
