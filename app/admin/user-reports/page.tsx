import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { DismissUserReportButton } from '@/components/admin/dismiss-user-report-button'

const REASON_LABELS: Record<string, string> = {
  scam_or_fraud: 'Scam or fraud',
  harassment: 'Harassment',
  fake_profile: 'Fake profile',
  inappropriate_behavior: 'Inappropriate behavior',
  payment_dispute: 'Payment dispute',
  other: 'Other',
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    pending: 'bg-[#FEF3E2] text-[#C26A08]',
    dismissed: 'bg-[#F3F4F6] text-[#6B7280]',
    actioned: 'bg-[#E8F5E9] text-[#1A7A4A]',
  }
  return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[s] ?? map.pending}`
}

export default async function AdminUserReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('user_reports')
    .select(
      'id, reason, description, status, created_at, conversation_id, reporter_id, reported_user_id, reporter:users!reporter_id(username), reported:users!reported_user_id(username)'
    )
    .order('created_at', { ascending: false })

  const pendingCount = (reports ?? []).filter((r) => r.status === 'pending').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1F2937]">User Reports</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">{pendingCount} pending</p>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-white">
          <p className="text-sm text-[#9CA3AF]">No user reports yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Reporter', 'Reported', 'Reason', 'Details', 'Submitted', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {(reports as any[]).map((report) => {
                const reporter = Array.isArray(report.reporter) ? report.reporter[0] : report.reporter
                const reported = Array.isArray(report.reported) ? report.reported[0] : report.reported
                return (
                  <tr key={report.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 text-[#4B5563]">
                      {reporter?.username ? (
                        <Link
                          href={`/profile/${reporter.username}`}
                          className="hover:text-[#F36D21] hover:underline"
                          target="_blank"
                        >
                          @{reporter.username}
                        </Link>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      {reported?.username ? (
                        <Link
                          href={`/profile/${reported.username}`}
                          className="font-medium text-[#F36D21] hover:underline"
                          target="_blank"
                        >
                          @{reported.username}
                        </Link>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-xs text-[#6B7280]" title={report.description}>
                        {report.description ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                      {formatRelativeTime(report.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(report.status)}>{report.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {report.conversation_id && (
                          <Link
                            href={`/chat/${report.conversation_id}`}
                            className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#4B5563] hover:bg-[#F3F4F6]"
                            target="_blank"
                          >
                            View chat
                          </Link>
                        )}
                        {reported?.username && (
                          <Link
                            href={`/admin/users?q=${reported.username}`}
                            className="rounded-lg border border-[#FDEDEC] px-2.5 py-1 text-xs font-medium text-[#C0392B] hover:bg-[#FDEDEC]"
                          >
                            Ban user
                          </Link>
                        )}
                        {report.status === 'pending' && (
                          <DismissUserReportButton reportId={report.id} />
                        )}
                      </div>
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
