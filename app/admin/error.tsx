'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl">🦊</div>
      <h2 className="text-xl font-semibold text-[#1F2937]">Admin panel error</h2>
      <p className="max-w-sm text-sm text-[#6B7280]">
        Something went wrong in the admin panel. This has been logged.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
        >
          Admin dashboard
        </Link>
      </div>
    </div>
  )
}
