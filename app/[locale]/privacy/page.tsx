import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function PrivacyPage() {
  const t = await getTranslations('static')
  const tSettings = await getTranslations('settings')
  const tProduct = await getTranslations('product')
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1F2937]">{tSettings('privacyPolicy')}</h1>
      <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
        {t('privacyBody')}
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-[#F36D21] hover:underline"
      >
        ← {tProduct('backToBrowse')}
      </Link>
    </main>
  )
}
