'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SECTION_LABELS: { prefix: string; label: string }[] = [
  { prefix: '/admin/products', label: 'Listings' },
  { prefix: '/admin/users', label: 'Users' },
  { prefix: '/admin/user-reports', label: 'User Reports' },
  { prefix: '/admin/reports', label: 'Reports' },
  { prefix: '/admin/analytics', label: 'Analytics' },
  { prefix: '/admin/messages', label: 'Messages' },
]

function sectionLabel(pathname: string): string {
  if (pathname === '/admin') return 'Dashboard'
  const match = SECTION_LABELS.find((s) => pathname.startsWith(s.prefix))
  return match?.label ?? 'Dashboard'
}

type AdminTopbarProps = {
  adminName: string
  adminAvatar: string | null
  adminUsername: string
}

export function AdminTopbar({ adminName, adminAvatar, adminUsername }: AdminTopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [menuOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initial = (adminName || adminUsername || '?')[0]?.toUpperCase()

  return (
    <header className="sticky top-0 z-10 hidden h-16 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-6 backdrop-blur-sm lg:flex">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold tracking-tight text-[#1F2937]">
          {sectionLabel(pathname)}
        </h1>
        <span className="text-xs font-medium text-[#D1D5DB]">/</span>
        <span className="text-xs font-medium text-[#9CA3AF]">Admin</span>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/feed"
          className="flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#F36D21]"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to site</span>
        </Link>

        <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2.5 text-sm transition-colors hover:bg-[#F3F4F6]"
        >
          {adminAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={adminAvatar}
              alt=""
              className="size-7 shrink-0 rounded-full bg-[#F3F4F6] object-cover"
            />
          ) : (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FEF3E2] text-xs font-semibold text-[#C26A08]">
              {initial}
            </div>
          )}
          <span className="max-w-[140px] truncate font-medium text-[#374151]">{adminName}</span>
          <ChevronDown className="size-3.5 shrink-0 text-[#9CA3AF]" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
            >
              <Settings className="size-4 text-[#6B7280]" strokeWidth={1.75} />
              Settings
            </Link>
            <div className="h-px bg-[#F3F4F6]" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#C0392B] hover:bg-[#FDEDEC]"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              Log out
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  )
}
