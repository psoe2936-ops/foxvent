'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F9FAFB] p-6 text-center">
      <div className="text-5xl">🦊</div>
      <h2 className="text-xl font-semibold text-[#1F2937]">Something went wrong</h2>
      <p className="max-w-sm text-sm text-[#6B7280]">
        We hit an unexpected error. This has been logged and we&apos;ll look into it. Please try
        again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/feed"
          className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-white"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  )
}
