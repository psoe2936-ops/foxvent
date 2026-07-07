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

  const activeHome = isActive('/feed', true)
  const activeChat = isActive('/chat')
  const activeProfile = isActive('/profile')

  const itemCls = (active: boolean) =>
    `flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-transform active:scale-90 ${
      active ? 'text-[#F36D21]' : 'text-[#9CA3AF]'
    }`

  const pillCls = (active: boolean) =>
    `flex size-9 items-center justify-center rounded-full transition-all duration-200 ${
      active ? 'bg-[#FEF3E2]' : ''
    }`

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-white/80 backdrop-blur-xl border-t border-white/40 shadow-[0_-8px_32px_rgba(0,0,0,0.06)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around pt-1 pb-2">

        {/* Home */}
        <Link href="/feed" className={itemCls(activeHome)}>
          <span className={pillCls(activeHome)}>
            <House className="size-5" strokeWidth={activeHome ? 2.5 : 1.75} />
          </span>
          <span>Home</span>
        </Link>

        {/* Search */}
        <button
          type="button"
          onClick={() => router.push('/feed')}
          className={itemCls(false)}
          aria-label="Search"
        >
          <span className={pillCls(false)}>
            <Search className="size-5" strokeWidth={1.75} />
          </span>
          <span>Search</span>
        </button>

        {/* Sell — elevated above bar */}
        <div className="-translate-y-2 flex flex-col items-center gap-0.5">
          <Link
            href={username ? `/profile/${username}?new=1` : '/?login=1'}
            className="flex size-14 items-center justify-center rounded-full bg-[#F36D21] text-white shadow-[0_4px_20px_rgba(243,109,33,0.4)] transition-transform active:scale-90"
            aria-label="Sell"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </Link>
          <span className="text-[10px] font-medium text-[#9CA3AF]">Sell</span>
        </div>

        {/* Messages */}
        <Link href="/chat" className={itemCls(activeChat)}>
          <span className={`${pillCls(activeChat)} relative`}>
            <MessageCircle className="size-5" strokeWidth={activeChat ? 2.5 : 1.75} />
            {userId && <SidebarUnreadBadge userId={userId} type="messages" />}
          </span>
          <span>Messages</span>
        </Link>

        {/* Profile */}
        <Link
          href={username ? `/profile/${username}` : '/feed'}
          className={itemCls(activeProfile)}
        >
          <span className={pillCls(activeProfile)}>
            <User className="size-5" strokeWidth={activeProfile ? 2.5 : 1.75} />
          </span>
          <span>Profile</span>
        </Link>

      </div>
    </nav>
  )
}
