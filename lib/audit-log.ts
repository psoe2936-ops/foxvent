import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Record<string, unknown> | null
): Promise<void> {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  })

  if (error) {
    console.error('Failed to write admin audit log:', { action, targetType, targetId, error })
  }
}
