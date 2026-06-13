'use client'

import { Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { AuthPreviewToggle } from '@/components/navbar/auth-preview-toggle'
import { Logo } from '@/components/navbar/logo'
import { ProfileBlock } from '@/components/navbar/profile-block'
import { SearchBar } from '@/components/navbar/search-bar'
import { SellButton } from '@/components/navbar/sell-button'
import { SignUpButton } from '@/components/navbar/sign-up-button'
import { UtilityIcons } from '@/components/navbar/utility-icons'

type NavbarProps = {
  /** Controlled auth UI state. Omit to use the built-in preview toggle. */
  isLoggedIn?: boolean
  /** Hide the floating dev preview toggle (e.g. when you wire your own state). */
  showPreviewToggle?: boolean
}

export function Navbar({
  isLoggedIn: controlledIsLoggedIn,
  showPreviewToggle = true,
}: NavbarProps) {
  const [internalLoggedIn, setInternalLoggedIn] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const isControlled = controlledIsLoggedIn !== undefined
  const isLoggedIn = isControlled ? controlledIsLoggedIn : internalLoggedIn

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] p-3 bg-[#FEFEFE]">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6"
          aria-label="Main navigation"
        >
          {/* Left: logo + hamburger */}
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

          {/* Center: search (desktop) */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar />
          </div>

          {/* Right: actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#2D2E32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30 md:hidden"
            >
              <Search className="size-5" aria-hidden="true" />
            </button>

            <SellButton />
            <UtilityIcons />

            {isLoggedIn ? (
              <ProfileBlock />
            ) : (
              <SignUpButton />
            )}
          </div>
        </nav>

        {mobileSearchOpen && (
          <div className="border-t border-[#E5E7EB] px-4 py-3 md:hidden">
            <SearchBar />
          </div>
        )}
      </header>

      {showPreviewToggle && !isControlled && (
        <AuthPreviewToggle
          isLoggedIn={isLoggedIn}
          onToggle={() => setInternalLoggedIn((prev) => !prev)}
        />
      )}
    </>
  )
}
