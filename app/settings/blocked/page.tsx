import { Shield } from 'lucide-react'
import Link from 'next/link'

export default function BlockedPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/settings" className="text-sm text-[#9CA3AF] hover:text-[#6B7280]">
          ← Settings
        </Link>
      </div>
      <h1 className="text-xl font-bold text-[#1F2937]">Block list</h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
        <Shield className="size-10 text-[#D1D5DB]" />
        <p className="mt-3 text-sm font-medium text-[#4B5563]">No blocked users</p>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Users you block won&apos;t be able to message you or see your listings.
        </p>
      </div>
    </main>
  )
}
