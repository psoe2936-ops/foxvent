'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

  return supabase
}

export async function dismissUserReport(
  reportId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await verifyAdmin()

  const { error, count } = await supabase
    .from('user_reports')
    .update({ status: 'dismissed' }, { count: 'exact' })
    .eq('id', reportId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Dismiss failed — no rows affected. Check permissions.' }

  revalidatePath('/admin/user-reports')
  return { success: true }
}
