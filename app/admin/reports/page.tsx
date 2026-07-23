import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { DismissReportButton } from '@/components/admin/dismiss-report-button'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select(
      'id, reason, description, status, created_at, product_id, reporter_id, users!reporter_id(username), products(id, title)'
    )
    .order('created_at', { ascending: false })

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      pending: 'bg-[#FEF3E2] text-[#C26A08]',
      dismissed: 'bg-[#F3F4F6] text-[#6B7280]',
      actioned: 'bg-[#E8F5E9] text-[#1A7A4A]',
    }
    return `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[s] ?? map.pending}`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1F2937]">Reports</h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          {(reports ?? []).filter((r) => r.status === 'pending').length} pending
        </p>
      </div>

      {!reports || reports.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[#E5E7EB] bg-white">
          <p className="text-sm text-[#9CA3AF]">No reports yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Reporter', 'Listing', 'Reason', 'Details', 'Submitted', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {reports.map((report: any) => {
                const reporter = Array.isArray(report.users) ? report.users[0] : report.users
                const product = Array.isArray(report.products) ? report.products[0] : report.products
                return (
                  <tr key={report.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3 text-[#4B5563]">
                      @{reporter?.username ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {product ? (
                        <Link
                          href={`/products/${product.id}`}
                          className="max-w-[160px] truncate font-medium text-[#F36D21] hover:underline"
                        >
                          {product.title}
                        </Link>
                      ) : (
                        <span className="text-[#9CA3AF]">Deleted</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">{report.reason}</td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-xs text-[#6B7280]">
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
                        {product && (
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#4B5563] hover:bg-[#F3F4F6]"
                          >
                            Take action
                          </Link>
                        )}
                        {report.status === 'pending' && (
                          <DismissReportButton reportId={report.id} />
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
