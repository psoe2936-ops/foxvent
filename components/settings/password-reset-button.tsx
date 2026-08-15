'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export function PasswordResetButton({ email }: { email: string }) {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const supabase = createClient()

  async function handleReset() {
    setStatus('loading')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setStatus(error ? 'error' : 'sent')
  }

  if (status === 'sent') {
    return (
      <p className="text-sm text-green-600">
        {t('resetLinkSent')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleReset}
        disabled={status === 'loading'}
        className="self-start rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#2D2E32] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50"
      >
        {status === 'loading' ? t('sending') : t('sendResetEmail')}
      </button>
      {status === 'error' && (
        <p className="text-xs text-[#C0392B]">{tCommon('somethingWentWrong')}</p>
      )}
    </div>
  )
}
