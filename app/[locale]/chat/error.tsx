'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('chat')
  const tCommon = useTranslations('common')

  useEffect(() => {
    console.error('Chat error:', error)
  }, [error])

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
        <div className="text-5xl">🦊</div>
        <h2 className="text-xl font-semibold text-[#1F2937]">{t('couldntLoadMessages')}</h2>
        <p className="max-w-sm text-sm text-[#6B7280]">
          {t('loadErrorBody')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {tCommon('tryAgain')}
          </button>
          <Link
            href="/chat"
            className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
          >
            {t('backToChats')}
          </Link>
        </div>
      </div>
    </main>
  )
}
