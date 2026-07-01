import { createClient } from '@/lib/supabase/server'
import { BanButton } from '@/components/admin/ban-button'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, username, full_name, role, created_at, is_banned, banned_until, ban_reason')
    .order('created_at', { ascending: false })

  function banBadge(user: {
    is_banned: boolean
    banned_until: string | null
    ban_reason: string | null
  }) {
    if (!user.is_banned) {
      return (
        <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-xs font-semibold text-[#1A7A4A]">
          Active
        </span>
      )
    }
    if (!user.banned_until) {
      return (
        <span
          title={user.ban_reason ?? undefined}
          className="cursor-help rounded-full bg-[#FDEDEC] px-2 py-0.5 text-xs font-semibold text-[#C0392B]"
        >
          Banned
        </span>
      )
    }
    return (
      <span
        title={user.ban_reason ?? undefined}
        className="cursor-help rounded-full bg-[#FEF3E2] px-2 py-0.5 text-xs font-semibold text-[#C26A08]"
      >
        Banned until {new Date(user.banned_until).toLocaleDateString()}
      </span>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2D2E32]">Users</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        All registered accounts on FoxVent.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Username</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!users || users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[#6B7280]">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]"
                >
                  <td className="px-5 py-3 font-medium text-[#2D2E32]">
                    {user.full_name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-[#6B7280]">
                    @{user.username}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-[#FEF3E2] text-[#C26A08]'
                          : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}
                    >
                      {user.role ?? 'user'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {banBadge(user)}
                  </td>
                  <td className="px-5 py-3 text-[#9CA3AF]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {user.role !== 'admin' && (
                      <BanButton
                        userId={user.id}
                        username={user.username}
                        isBanned={user.is_banned ?? false}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
