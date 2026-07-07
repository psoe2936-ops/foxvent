import type { SupabaseClient } from '@supabase/supabase-js'

export function formatRetryTime(seconds: number): string {
  if (seconds <= 60) return `${Math.max(1, seconds)} seconds`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  actionType: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const windowStart = new Date(
      Date.now() - windowMinutes * 60 * 1000
    ).toISOString()

    const { count } = await supabase
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .gte('created_at', windowStart)

    if ((count ?? 0) >= maxAttempts) {
      const { data: oldest } = await supabase
        .from('rate_limits')
        .select('created_at')
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      const retryAfterSeconds = oldest
        ? Math.ceil(
            (new Date(oldest.created_at).getTime() +
              windowMinutes * 60 * 1000 -
              Date.now()) / 1000
          )
        : windowMinutes * 60

      return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) }
    }

    await supabase.from('rate_limits').insert({
      user_id: userId,
      action_type: actionType,
    })

    return { allowed: true }
  } catch {
    // Fail open — don't block legitimate users due to DB errors
    return { allowed: true }
  }
}
