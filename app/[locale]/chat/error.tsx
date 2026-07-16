'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Chat error:', error)
  }, [error])

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
        <div className="text-5xl">🦊</div>
        <h2 className="text-xl font-semibold text-[#1F2937]">Couldn&apos;t load messages</h2>
        <p className="max-w-sm text-sm text-[#6B7280]">
          Something went wrong loading this conversation. Please try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/chat"
            className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
          >
            Back to chats
          </Link>
        </div>
      </div>
    </main>
  )
}
