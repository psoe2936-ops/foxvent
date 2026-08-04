'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { approveProduct } from '@/app/admin/products/actions'
import { useToast } from '@/components/ui/toast'

type Props = {
  productId: string
  variant?: 'icon' | 'full'
}

export function ApproveButton({ productId, variant = 'icon' }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveProduct(productId)
      if ('error' in result) {
        showToast(result.error, 'error')
        return
      }
      showToast('Listing approved.', 'success')
      router.refresh()
    })
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleApprove}
        disabled={isPending}
        className="w-full rounded-lg bg-[#1A7A4A] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? 'Approving…' : 'Approve listing'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={isPending}
      title="Approve"
      className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#1A7A4A] transition-colors hover:bg-[#E8F5E9] disabled:opacity-60"
    >
      <Check className="size-3.5" />
    </button>
  )
}
