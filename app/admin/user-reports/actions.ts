'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function dismissUserReport(reportId: string) {
  const supabase = await createClient()
  await supabase
    .from('user_reports')
    .update({ status: 'dismissed' })
    .eq('id', reportId)
  revalidatePath('/admin/user-reports')
}
