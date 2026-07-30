import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

type Section = { heading: string; body: string }

export default async function PrivacyPage() {
  const t = await getTranslations('static.privacy')
  const tProduct = await getTranslations('product')
  const sections = t.raw('sections') as Section[]

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1F2937]">{t('title')}</h1>
      <p className="mt-2 text-sm text-[#9CA3AF]">{t('lastUpdated')}</p>

      <p className="mt-6 text-base leading-relaxed text-[#6B7280]">{t('intro')}</p>

      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-base font-semibold text-[#1F2937]">{section.heading}</h2>
            <p className="mt-2 text-base leading-relaxed text-[#6B7280]">{section.body}</p>
          </section>
        ))}
      </div>

      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-[#F36D21] hover:underline"
      >
        ← {tProduct('backToBrowse')}
      </Link>
    </main>
  )
}
