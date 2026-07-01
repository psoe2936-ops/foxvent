'use client'

import { useTransition } from 'react'
import { dismissReport } from '@/app/admin/reports/actions'

export function DismissReportButton({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => dismissReport(reportId))}
      className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280] disabled:opacity-50"
    >
      {pending ? 'Dismissing...' : 'Dismiss'}
    </button>
  )
}
