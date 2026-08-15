'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissReport } from '@/app/admin/reports/actions'
import { useToast } from '@/components/ui/toast'

export function DismissReportButton({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissReport(reportId)
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
      disabled={pending}
      onClick={handleDismiss}
      className="rounded-lg border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280] disabled:opacity-50"
    >
      {pending ? 'Dismissing...' : 'Dismiss'}
    </button>
  )
}
