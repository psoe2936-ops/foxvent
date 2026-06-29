'use client'

import { Menu, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/navbar/logo'
import { ProfileBlock } from '@/components/navbar/profile-block'
import { SearchBar } from '@/components/navbar/search-bar'
import { SellButton } from '@/components/navbar/sell-button'
import { SignUpButton } from '@/components/navbar/sign-up-button'
import { UtilityIcons } from '@/components/navbar/utility-icons'
import AuthModal from '@/components/AuthModal'

type Profile = {
  username: string
  full_name: string
  avatar_url: string | null
  role?: string
} | null

type NavbarProps = {
  user: { id: string; email?: string } | null
  profile: Profile
}

export function Navbar({ user, profile }: NavbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register')
  const [pendingNext, setPendingNext] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('login') === '1') {
      const next = searchParams.get('next')
      setModalMode('login')
      setPendingNext(next)
      setModalOpen(true)
      router.replace('/')
    }
  }, [searchParams, router])

  const isLoggedIn = !!user

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode)
    setModalOpen(true)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] p-3 bg-[#FEFEFE]">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6"
          aria-label="Main navigation"
        >
          <div className="flex shrink-0 items-center gap-2">
            <Logo />
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30 lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
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
              <ProfileBlock profile={profile} />
            ) : (
              <SignUpButton onClick={() => openModal('register')} />
            )}
          </div>
        </nav>

        {mobileSearchOpen && (
          <div className="border-t border-[#E5E7EB] px-4 py-3 md:hidden">
            <SearchBar />
          </div>
        )}
      </header>

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