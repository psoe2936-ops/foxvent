'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissUserReport } from '@/app/admin/user-reports/actions'
import { useToast } from '@/components/ui/toast'

export function DismissUserReportButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissUserReport(reportId)
      if ('error' in result) {
        showToast(result.error, 'error')
        return
      }
      showToast('Report dismissed.', 'success')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDismiss}
      className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-60"
    >
      {isPending ? '…' : 'Dismiss'}
    </button>
  )
}
