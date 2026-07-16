'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  Bell,
  Heart,
  Home,
  Lock,
  MessageCircle,
  Settings,
  Store,
  Users,
} from 'lucide-react'

import { SidebarUnreadBadge } from '@/components/feed/sidebar-unread-badge'

type FeedSidebarProps = {
  username?: string
  userId?: string
}

const baseClass =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#4B5563] transition-colors hover:bg-white hover:text-[#1F2937]'
const activeClass =
  'flex items-center gap-3 rounded-lg bg-[#FEF3E2] px-3 py-2.5 text-[13px] font-medium text-[#F36D21]'
const lockedClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#9CA3AF] transition-colors hover:bg-white hover:text-[#6B7280]'

export function FeedSidebar({ userId }: FeedSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('sidebar')
  const isLoggedIn = !!userId

  const ctaHref = isLoggedIn ? '/feed/listings' : '/?login=1'

  function onLock(target: string) {
    router.push(`/?login=1&next=${encodeURIComponent(target)}`)
  }

  function lc(href: string, prefix = false) {
    const hit = prefix ? pathname.startsWith(href) : pathname === href
    return hit ? activeClass : baseClass
  }

  return (
    <aside className="scrollbar-none sticky top-20 hidden h-[calc(100vh-5rem)] w-[220px] shrink-0 flex-col overflow-y-auto border-r border-white/40 bg-white/60 py-6 pl-4 pr-3 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:flex lg:pl-5">
      <nav className="space-y-1">

        {/* Home */}
        <Link href="/feed" className={lc('/feed')}>
          <Home className="size-4.5 shrink-0" strokeWidth={1.75} />
          {t('home')}
        </Link>

        {/* Wishlist */}
        {isLoggedIn ? (
          <Link href="/feed/wishlist" className={lc('/feed/wishlist')}>
            <Heart className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('wishlist')}
          </Link>
        ) : (
          <button type="button" onClick={() => onLock('/feed/wishlist')} className={lockedClass}>
            <Heart className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('wishlist')}
            <Lock className="ml-auto size-3 text-[#D1D5DB]" />
          </button>
        )}

        {/* My Listings */}
        {isLoggedIn ? (
          <Link href="/feed/listings" className={lc('/feed/listings')}>
            <Store className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('myListings')}
          </Link>
        ) : (
          <button type="button" onClick={() => onLock('/feed/listings')} className={lockedClass}>
            <Store className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('myListings')}
            <Lock className="ml-auto size-3 text-[#D1D5DB]" />
          </button>
        )}

        {/* Following */}
        {isLoggedIn ? (
          <Link href="/feed/following" className={lc('/feed/following')}>
            <Users className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('following')}
          </Link>
        ) : (
          <button type="button" onClick={() => onLock('/feed/following')} className={lockedClass}>
            <Users className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('following')}
            <Lock className="ml-auto size-3 text-[#D1D5DB]" />
          </button>
        )}

        {/* Messages */}
        {isLoggedIn ? (
          <Link href="/feed/messages" className={lc('/feed/messages')}>
            <span className="relative shrink-0">
              <MessageCircle className="size-4.5" strokeWidth={1.75} />
              {userId && <SidebarUnreadBadge userId={userId} type="messages" />}
            </span>
            {t('messages')}
          </Link>
        ) : (
          <button type="button" onClick={() => onLock('/feed/messages')} className={lockedClass}>
            <MessageCircle className="size-4.
            5 shrink-0" strokeWidth={1.75} />
            {t('messages')}
            <Lock className="ml-auto size-3 text-[#D1D5DB]" />
          </button>
        )}

        {/* Notifications */}
        {isLoggedIn ? (
          <Link href="/feed/notifications" className={lc('/feed/notifications')}>
            <span className="relative shrink-0">
              <Bell className="size-4.5" strokeWidth={1.75} />
              {userId && <SidebarUnreadBadge userId={userId} type="notifications" />}
            </span>
            {t('notifications')}
          </Link>
        ) : (
          <button type="button" onClick={() => onLock('/feed/notifications')} className={lockedClass}>
            <Bell className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('notifications')}
            <Lock className="ml-auto size-3 text-[#D1D5DB]" />
          </button>
        )}

        {/* Settings */}
        {isLoggedIn ? (
          <Link href="/settings" className={lc('/settings')}>
            <Settings className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('settings')}
          </Link>
        ) : (
          <button type="button" onClick={() => onLock('/settings')} className={lockedClass}>
            <Settings className="size-4.5 shrink-0" strokeWidth={1.75} />
            {t('settings')}
            <Lock className="ml-auto size-3 text-[#D1D5DB]" />
          </button>
        )}
      </nav>

      {/* CTA card */}
      <div className="mt-8 rounded-xl bg-gradient-to-br from-[#FEF3E2] to-[#FDE8D4] p-6">
        <div className="flex justify-center">
          <Image
            src="/fox-welcome.png"
            alt="FoxVent mascot"
            width={80}
            height={80}
            className="size-12 object-contain"
          />
        </div>
        <p className="mt-3 text-center text-sm font-semibold leading-snug text-[#1F2937]">
          {t('shopSmartTitle')}
        </p>
        <p className="mt-1 text-center text-xs leading-relaxed text-[#6B7280]">
          {t('shopSmartBody')}
        </p>
        <Link
          href={ctaHref}
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#F36D21] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          {isLoggedIn ? t('myListings') : t('getStarted')}
        </Link>
      </div>

      <footer className="mt-auto space-y-3 px-1 pt-10">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#9CA3AF]">
          <Link href="/about" className="hover:text-[#6B7280]">About</Link>
          <Link href="/settings" className="hover:text-[#6B7280]">Help</Link>
          <Link href="/terms" className="hover:text-[#6B7280]">Terms</Link>
          <Link href="/privacy" className="hover:text-[#6B7280]">Privacy</Link>
        </div>
        <p className="text-[10px] text-[#D1D5DB]">© 2026 FoxVent</p>
      </footer>
    </aside>
  )
}