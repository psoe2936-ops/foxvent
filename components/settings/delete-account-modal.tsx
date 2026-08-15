'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function DeleteAccountModal() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[#9CA3AF] underline underline-offset-2 hover:text-[#C0392B]"
      >
        {t('deleteAccount')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-3xl border border-white/60 bg-white/90 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150 sm:rounded-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-[#9CA3AF] hover:text-[#6B7280]"
              aria-label={tCommon('close')}
            >
              <X className="size-5" />
            </button>

            <h2 className="text-base font-bold text-[#1F2937]">{t('deleteAccount')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              {t('accountDeletionHandled')}
            </p>
            <p className="mt-3 text-sm text-[#6B7280]">
              {t('pleaseEmail')}{' '}
              <a
                href="mailto:support@foxvend.com"
                className="font-medium text-[#F36D21] hover:underline"
              >
                support@foxvend.com
              </a>{' '}
              {t('fromRegisteredAddress')}
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#F3F4F6] py-2.5 text-sm font-medium text-[#4B5563] hover:bg-[#E5E7EB]"
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
