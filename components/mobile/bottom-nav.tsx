'use client'

import Link from 'next/link'
import { House, Search, Plus, MessageCircle, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { SidebarUnreadBadge } from '@/components/feed/sidebar-unread-badge'

type BottomNavProps = {
  username: string | null
  userId: string | null
}

export function BottomNav({ username, userId }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  if (!userId) return null

  const isActive = (path: string, exact = false) =>
    exact ? pathname === path : pathname.startsWith(path)

  const itemCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-1 text-[10px] font-medium transition-colors ${
      active ? 'text-[#F36D21]' : 'text-[#9CA3AF]'
    }`

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around border-t border-[#E5E7EB] bg-white pb-safe-or-4 pt-1 md:hidden">
      <Link href="/feed" className={itemCls(isActive('/feed', true))}>
        <House className="size-5" strokeWidth={isActive('/feed', true) ? 2.5 : 1.75} />
        <span>Home</span>
      </Link>

      <button
        type="button"
        onClick={() => router.push('/feed')}
        className={itemCls(false)}
        aria-label="Search"
      >
        <Search className="size-5" strokeWidth={1.75} />
        <span>Search</span>
      </button>

      <Link
        href={username ? `/profile/${username}` : '/feed?login=1'}
        className="-mt-5 mb-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-[#F36D21] text-white shadow-lg shadow-[#F36D21]/30"
        aria-label="Sell"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </Link>

      <Link href="/chat" className={itemCls(isActive('/chat'))}>
        <span className="relative">
          <MessageCircle className="size-5" strokeWidth={isActive('/chat') ? 2.5 : 1.75} />
          {userId && <SidebarUnreadBadge userId={userId} type="messages" />}
        </span>
        <span>Messages</span>
      </Link>

      <Link
        href={username ? `/profile/${username}` : '/feed'}
        className={itemCls(isActive('/profile'))}
      >
        <User className="size-5" strokeWidth={isActive('/profile') ? 2.5 : 1.75} />
        <span>Profile</span>
      </Link>
    </nav>
  )
}
