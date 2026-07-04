'use client'

import { useTransition } from 'react'
import { dismissUserReport } from '@/app/admin/user-reports/actions'

export function DismissUserReportButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => dismissUserReport(reportId))}
      className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-60"
    >
      {isPending ? '…' : 'Dismiss'}
    </button>
  )
}
