'use client'

import { Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Heart,
  Home,
  MessageCircle,
  Settings,
  Store,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/navbar/logo'
import { ProfileBlock } from '@/components/navbar/profile-block'
import { SearchBar } from '@/components/navbar/search-bar'
import { SellButton } from '@/components/navbar/sell-button'
import { SignUpButton } from '@/components/navbar/sign-up-button'
import { UtilityIcons } from '@/components/navbar/utility-icons'
import { SidebarUnreadBadge } from '@/components/feed/sidebar-unread-badge'
import AuthModal from '@/components/AuthModal'

type Profile = {
  username: string
  full_name: string
  avatar_url: string | null
  role?: string
} | null

type Category = { id: string; name: string; icon: string | null }

type NavbarProps = {
  user: { id: string; email?: string } | null
  profile: Profile
  categories?: Category[]
}

const DRAWER_LINKS = [
  { href: '/feed', label: 'Home', Icon: Home },
  { href: '/feed/wishlist', label: 'Wishlist', Icon: Heart },
  { href: '/feed/listings', label: 'My Listings', Icon: Store },
  { href: '/feed/following', label: 'Following', Icon: Users },
  { href: '/chat', label: 'Messages', Icon: MessageCircle, badge: 'messages' as const },
  { href: '/feed/notifications', label: 'Notifications', Icon: Bell, badge: 'notifications' as const },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function Navbar({ user, profile, categories = [] }: NavbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register')
  const [pendingNext, setPendingNext] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('login') === '1') {
      const next = searchParams.get('next')
      const timer = window.setTimeout(() => {
        setModalMode('login')
        setPendingNext(next)
        setModalOpen(true)
        router.replace('/')
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [searchParams, router])

  // Close drawer on escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    if (drawerOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const isLoggedIn = !!user

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode)
    setModalOpen(true)
  }

  const displayName = profile?.full_name ?? profile?.username ?? 'User'
  const avatarUrl = profile?.avatar_url
  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 p-2 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-3">
        <nav
          className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-2 sm:h-16 sm:gap-4 sm:px-6"
          aria-label="Main navigation"
        >
          {/* Left: logo + hamburger (mobile) */}
          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            <Logo
              iconClassName="size-9"
              textClassName="hidden text-lg sm:inline sm:text-[1.35rem]"
            />
            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30 lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop search */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar categories={categories} />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            {/* Mobile: search icon button */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30 md:hidden"
            >
              <Search className="size-5" aria-hidden="true" />
            </button>

            <SellButton
              isLoggedIn={isLoggedIn}
              onRequireAuth={() => openModal('login')}
              username={profile?.username}
            />

            {isLoggedIn && user && <UtilityIcons userId={user.id} />}

            {isLoggedIn ? (
              <ProfileBlock profile={profile} className="hidden md:flex" />
            ) : (
              <SignUpButton onClick={() => openModal('register')} />
            )}
          </div>
        </nav>

        {/* Mobile search bar (expands below navbar) */}
        {mobileSearchOpen && (
          <div className="border-t border-[#E5E7EB] px-4 py-3 md:hidden">
            <SearchBar categories={categories} />
          </div>
        )}
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/60 bg-white/80 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden">
            {/* Drawer header: user info */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="size-10 shrink-0 overflow-hidden rounded-full">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-[#FEF3E2] text-sm font-bold text-[#C26A08]">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1F2937]">
                      {displayName}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">@{profile?.username}</p>
                  </div>
                </div>
              ) : (
                <Logo iconClassName="size-9" />
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#F3F4F6]"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {isLoggedIn ? (
                DRAWER_LINKS.map(({ href, label, Icon, badge }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#1F2937]"
                  >
                    <span className="relative shrink-0">
                      <Icon className="size-5" strokeWidth={1.75} />
                      {badge && user?.id && (
                        <SidebarUnreadBadge userId={user.id} type={badge} />
                      )}
                    </span>
                    {label}
                  </Link>
                ))
              ) : (
                <>
                  <Link href="/feed" onClick={() => setDrawerOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6]">
                    <Home className="size-5" strokeWidth={1.75} />
                    Browse listings
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setDrawerOpen(false); openModal('login') }}
                    className="flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#F36D21] hover:bg-[#FEF3E2]"
                  >
                    Log in
                  </button>
                </>
              )}
            </nav>

            {/* Profile link at bottom */}
            {isLoggedIn && profile?.username && (
              <div className="border-t border-[#E5E7EB] p-3">
                <Link
                  href={`/profile/${profile.username}`}
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#4B5563] hover:bg-[#F3F4F6]"
                >
                  View my profile
                </Link>
              </div>
            )}
          </aside>
        </>
      )}

      <AuthModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setPendingNext(null)
        }}
        initialMode={modalMode}
        redirectTo={pendingNext ?? undefined}
      />
    </>
  )
}
