import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/settings/logout-button'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-[#2D2E32]">Settings</h1>

      <section className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#2D2E32]">Account</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-xs text-[#9CA3AF]">Email</dt>
            <dd className="mt-1 text-sm text-[#2D2E32]">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#9CA3AF]">Username</dt>
            <dd className="mt-1 text-sm text-[#2D2E32]">@{profile?.username}</dd>
          </div>
          {profile?.full_name && (
            <div>
              <dt className="text-xs text-[#9CA3AF]">Name</dt>
              <dd className="mt-1 text-sm text-[#2D2E32]">{profile.full_name}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6">
          <Link
            href={`/profile/${profile?.username}`}
            className="inline-flex rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#2D2E32] transition-colors hover:bg-[#F9FAFB]"
          >
            Edit profile
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#2D2E32]">Sign out</h2>
        <p className="mt-1.5 text-sm text-[#6B7280]">
          You will be signed out and returned to the home page.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </section>
    </main>
  )
}
