import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FoxIcon } from '@/components/navbar/fox-icon'

export function AdminBridgeBar() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-2 sm:px-6">
      <div className="flex items-center gap-2">
        <FoxIcon className="size-7" />
        <span className="text-sm font-semibold text-[#1F2937]">
          FoxVend
        </span>
        <span className="rounded bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#6B7280]">
          Admin
        </span>
      </div>
      <Link
        href="/feed"
        className="flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#F36D21]"
      >
        <ArrowLeft className="size-4" />
        <span className="hidden sm:inline">Back to site</span>
      </Link>
    </div>
  )
}
