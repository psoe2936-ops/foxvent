'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { type Locale } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const LOCALE_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'EN', flag: '🇬🇧' }, // left flag icon
  { value: 'my', label: 'မြန်မာ', flag: '🇲🇲' },// left flag icon
]

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

export function LanguageSwitcher({
  userId,
  className,
}: {
  userId?: string | null
  className?: string
}) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const current = LOCALE_OPTIONS.find((o) => o.value === locale) ?? LOCALE_OPTIONS[0]

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function selectLocale(next: Locale) {
    if (next === locale || isPending) return
    setOpen(false)
    setLocaleCookie(next)

    // Save to database if logged in
    if (userId) {
      await supabase
        .from('users')
        .update({ preferred_language: next })
        .eq('id', userId)
    }

    startTransition(() => {
      router.replace(pathname, { locale: next })
      router.refresh()
    })
  }

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        aria-label="Change language"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="inline-flex items-center gap-1 h-9 px-2 rounded-lg text-sm
          text-[#6B7280] transition-colors hover:bg-[#F3F4F6] 
          hover:text-[#2D2E32] focus-visible:outline-none 
          focus-visible:ring-2 focus-visible:ring-[#F36D21]/30 
          disabled:opacity-60"
      >
        <Globe className="size-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">
          {current.flag} {current.label}
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-36 
          overflow-hidden rounded-xl border border-white/60 
          bg-white/95 py-1 backdrop-blur-2xl
          shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectLocale(option.value)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#F3F4F6]',
                locale === option.value
                  ? 'font-semibold text-[#F36D21]'
                  : 'text-[#374151]'
              )}
            >
              <span aria-hidden="true">{option.flag}</span>
              <span>
                {option.value === 'en' ? 'English' : 'မြန်မာ'}
              </span>
              {locale === option.value && (
                <span className="ml-auto text-xs text-[#F36D21]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}