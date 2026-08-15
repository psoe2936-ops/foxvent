'use client'

import { useTranslations } from 'next-intl'

export function ContactSupportButton({ className }: { className?: string }) {
  const t = useTranslations('feed')
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-support-chat'))}
      className={className}
    >
      {t('contactSupport')}
    </button>
  )
}
