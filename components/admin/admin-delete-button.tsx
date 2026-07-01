'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProductAsAdmin } from '@/app/admin/products/actions'

export function AdminDeleteButton({ productId }: { productId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteProductAsAdmin(productId)
    })
  }

  if (!confirm) {
    return (
      <button
        type="button"
        title="Delete"
        onClick={() => setConfirm(true)}
        className="flex size-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#C0392B] transition-colors hover:bg-[#FDEDEC]"
      >
        <Trash2 className="size-3.5" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="rounded px-2 py-1 text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded bg-[#C0392B] px-2 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? '...' : 'Confirm'}
      </button>
    </div>
  )
}
