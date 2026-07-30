import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function AboutPage() {
  const t = await getTranslations('static.about')
  const tProduct = await getTranslations('product')
  const paragraphs = t.raw('paragraphs') as string[]

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1F2937]">{t('title')}</h1>
      <div className="mt-4 space-y-4">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-base leading-relaxed text-[#6B7280]">
            {paragraph}
          </p>
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
