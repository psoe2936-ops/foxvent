'use client'

import { Link } from '@/i18n/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('product')
  const tChat = useTranslations('chat')
  const tCommon = useTranslations('common')

  useEffect(() => {
    console.error('Product page error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl">🦊</div>
      <h2 className="text-xl font-semibold text-[#1F2937]">{t('couldntLoadListing')}</h2>
      <p className="max-w-sm text-sm text-[#6B7280]">
        {t('listingLoadErrorBody')}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {tCommon('tryAgain')}
        </button>
        <Link
          href="/feed"
          className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6]"
        >
          {tChat('browseListings')}
        </Link>
      </div>
    </div>
  )
}
