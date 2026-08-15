import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

type Faq = { q: string; a: string }

export default async function HelpPage() {
  const t = await getTranslations('static.help')
  const tProduct = await getTranslations('product')
  const faqs = t.raw('faqs') as Faq[]

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1F2937]">{t('title')}</h1>
      <p className="mt-4 text-base leading-relaxed text-[#6B7280]">{t('intro')}</p>

      <div className="mt-6 space-y-6">
        {faqs.map((faq) => (
          <section key={faq.q}>
            <h2 className="text-base font-semibold text-[#1F2937]">{faq.q}</h2>
            <p className="mt-2 text-base leading-relaxed text-[#6B7280]">{faq.a}</p>
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
