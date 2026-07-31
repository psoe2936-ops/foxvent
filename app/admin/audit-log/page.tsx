import { createClient } from '@/lib/supabase/server'

export default async function AdminAuditLogPage() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('admin_audit_log')
    .select('id, action, target_type, target_id, details, created_at, users!admin_id(username, full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  function formatTimestamp(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2937]">Audit Log</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          Last {entries?.length ?? 0} admin actions
        </p>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-white">
          <p className="text-sm text-[#9CA3AF]">No admin actions logged yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Date/Time', 'Admin', 'Action', 'Target', 'Details'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {entries.map((entry: any) => {
                const admin = Array.isArray(entry.users) ? entry.users[0] : entry.users
                return (
                  <tr key={entry.id} className="hover:bg-[#F9FAFB]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#9CA3AF]">
                      {formatTimestamp(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      @{admin?.username ?? 'unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#FEF3E2] px-2.5 py-0.5 text-xs font-semibold text-[#C26A08]">
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      {entry.target_type}
                      {entry.target_id && (
                        <span className="ml-1.5 font-mono text-xs text-[#9CA3AF]">
                          {entry.target_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="truncate text-xs text-[#6B7280]">
                        {entry.details ? JSON.stringify(entry.details) : '—'}
                      </p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
