'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type ProfileBlockProps = {
  profile?: {
    username: string
    full_name: string
    avatar_url: string | null
    role?: string
  } | null
  name?: string
  avatarUrl?: string
  className?: string
}

export function ProfileBlock({
  profile,
  name,
  avatarUrl,
  className,
}: ProfileBlockProps) {
  const t = useTranslations('navbar')
  const tChat = useTranslations('chat')
  const tSidebar = useTranslations('sidebar')
  const tCommon = useTranslations('common')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const displayName = name ?? profile?.full_name ?? profile?.username ?? 'User'
  const displayAvatarUrl = avatarUrl ?? profile?.avatar_url ?? null
  const initial = displayName[0]?.toUpperCase() ?? '?'

  const isAdmin = profile?.role === 'admin'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('profileMenu', { name: displayName })}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
      >
        {displayAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayAvatarUrl}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3E2] text-sm font-bold text-[#C26A08] ring-2 ring-white">
            {initial}
          </span>
        )}
        <span className="hidden min-w-0 flex-col items-start text-left md:flex">
          <span className="truncate text-sm font-semibold text-[#2D2E32]">
            {displayName}
          </span>
          <span className="text-xs text-[#9CA3AF]">{tChat('viewProfile')}</span>
        </span>
        <ChevronDown
          className={cn(
            'hidden size-4 shrink-0 text-[#9CA3AF] md:block transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/60 bg-white/90 py-1 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150"
        >
          <div className="px-4 py-2 border-b border-[#E5E7EB]">
            <p className="text-sm font-semibold text-[#2D2E32] truncate">{displayName}</p>
            <p className="text-xs text-[#9CA3AF] truncate">@{profile?.username}</p>
          </div>

          <Link
            href={`/profile/${profile?.username}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#2D2E32] hover:bg-[#F3F4F6]"
            role="menuitem"
          >
            {t('myProfile')}
          </Link>
          <Link
            href={`/profile/${profile?.username}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#2D2E32] hover:bg-[#F3F4F6]"
            role="menuitem"
          >
            {tSidebar('myListings')}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-[#F36D21] hover:bg-[#F3F4F6]"
              role="menuitem"
            >
              {t('adminPanel')}
            </Link>
          )}

          <div className="my-1 border-t border-[#E5E7EB]" />

          <button
            type="button"
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-[#C0392B] hover:bg-[#FDEDEC]"
            role="menuitem"
          >
            {tCommon('logout')}
          </button>
        </div>
      )}
    </div>
  )
}