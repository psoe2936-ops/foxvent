import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FoxIcon } from '@/components/navbar/fox-icon'

export default async function BannedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('is_banned, banned_until, ban_reason')
    .eq('id', user.id)
    .single()

  if (!profile?.is_banned) redirect('/')

  const bannedUntil = profile.banned_until ? new Date(profile.banned_until) : null
  const isPermanent = !bannedUntil

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <FoxIcon className="mx-auto size-12 opacity-50" />

        <h1 className="mt-4 text-xl font-bold text-[#2D2E32]">
          Account Restricted
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Your account has been restricted from accessing FoxVent.
        </p>

        {profile.ban_reason && (
          <div className="mt-5 rounded-xl bg-[#FEF3E2] px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C26A08]">
              Reason
            </p>
            <p className="mt-1 text-sm text-[#92400E]">{profile.ban_reason}</p>
          </div>
        )}

        <div className="mt-3 rounded-xl bg-[#FDEDEC] px-4 py-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C0392B]">
            Ban expires
          </p>
          <p className="mt-1 text-sm text-[#7B1D1D]">
            {isPermanent
              ? 'This ban is permanent.'
              : bannedUntil!.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </p>
        </div>

        <p className="mt-6 text-sm text-[#9CA3AF]">
          If you believe this is a mistake, please{' '}
          <a
            href="mailto:support@foxvent.com"
            className="font-medium text-[#F36D21] hover:underline"
          >
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  )
}
