'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useToast } from '@/components/ui/toast'

export function ShareButton({ title, price }: { title: string; price: number }) {
  const t = useTranslations('product')
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)

  async function handleShare() {
    if (busy) return
    setBusy(true)
    const url = window.location.href

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: t('shareText', { title, price: price.toLocaleString() }),
          url,
        })
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      } finally {
        setBusy(false)
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      showToast(t('linkCopied'), 'success')
    } catch {
      showToast(t('couldNotCopyLink'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] disabled:opacity-60"
    >
      <Share2 className="size-4" />
      {t('share')}
    </button>
  )
}
