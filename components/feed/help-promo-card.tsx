import { getTranslations } from 'next-intl/server'
import { Headphones } from 'lucide-react'
import { FoxIcon } from '@/components/navbar/fox-icon'
import { ContactSupportButton } from '@/components/support/contact-support-button'

export async function HelpPromoCard() {
  const t = await getTranslations('feed')

  return (
    <section className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <FoxIcon className="size-10" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#F36D21] text-white">
            <Headphones className="size-2.5" />
          </span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#1F2937]">
            {t('needHelp')}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
            {t('supportFoxHere')}
          </p>
          <ContactSupportButton className="mt-4 inline-flex items-center rounded-lg border border-[#E8EAED] bg-white px-3.5 py-2 text-xs font-semibold text-[#374151] transition-colors hover:border-[#F36D21]/30 hover:text-[#F36D21]" />
        </div>
      </div>
    </section>
  )
}