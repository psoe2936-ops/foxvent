import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('errors')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F9FAFB] p-6 text-center">
      <div className="text-6xl">🦊</div>
      <h1 className="text-2xl font-bold text-[#1F2937]">{t('pageNotFound')}</h1>
      <p className="max-w-sm text-sm text-[#6B7280]">
        {t('pageNotFoundBody')}
      </p>
      <Link
        href="/feed"
        className="rounded-lg bg-[#F36D21] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        {t('goToHomepage')}
      </Link>
    </div>
  )
}
