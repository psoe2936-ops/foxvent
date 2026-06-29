'use client'

import { Suspense, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart2,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react'
import { FoxIcon } from '@/components/navbar/fox-icon'
import { createClient } from '@/lib/supabase/client'
import { SupportUnreadBadge } from '@/components/admin/support-unread-badge'

function SidebarInner({ pendingCount, pendingReportsCount }: { pendingCount: number; pendingReportsCount: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const currentStatus = searchParams.get('status') ?? 'pending'
  const onProductsRoot = pathname === '/admin/products'

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function navClass(active: boolean) {
    return `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
      active
        ? 'bg-[#FEF3E2] text-[#F36D21]'
        : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#1F2937]'
    }`
  }

  function statusClass(status: string) {
    return navClass(onProductsRoot && currentStatus === status)
  }

  return (
    <aside className="scrollbar-none sticky top-20 flex h-[calc(100vh-5rem)] w-55 shrink-0 flex-col overflow-y-auto border-r border-[#E5E7EB] bg-white">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[#E5E7EB] px-4 py-4">
        <FoxIcon className="size-7" />
        <span className="text-sm font-bold text-[#1F2937]">FoxVent</span>
        <span className="rounded-md bg-[#FEF3E2] px-1.5 py-0.5 text-[10px] font-semibold text-[#C26A08]">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        <Link
          href="/admin"
          className={navClass(pathname === '/admin')}
        >
          <LayoutDashboard className="size-4 shrink-0" strokeWidth={1.75} />
          Dashboard
        </Link>

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Listings
        </p>

        <Link href="/admin/products?status=all" className={statusClass('all')}>
          <span className="size-4 shrink-0" />
          All Listings
        </Link>
        <Link href="/admin/products?status=pending" className={statusClass('pending')}>
          <span className="size-4 shrink-0" />
          Pending
          {pendingCount > 0 && (
            <span className="ml-auto rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[11px] font-semibold text-[#C26A08]">
              {pendingCount}
            </span>
          )}
        </Link>
        <Link href="/admin/products?status=approved" className={statusClass('approved')}>
          <span className="size-4 shrink-0" />
          Approved
        </Link>
        <Link href="/admin/products?status=rejected" className={statusClass('rejected')}>
          <span className="size-4 shrink-0" />
          Rejected
        </Link>

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Manage
        </p>

        <Link
          href="/admin/users"
          className={navClass(pathname.startsWith('/admin/users'))}
        >
          <Users className="size-4 shrink-0" strokeWidth={1.75} />
          Users
        </Link>
        <Link
          href="/admin/reports"
          className={navClass(pathname.startsWith('/admin/reports'))}
        >
          <BarChart2 className="size-4 shrink-0" strokeWidth={1.75} />
          Reports
          {pendingReportsCount > 0 && (
            <span className="ml-auto rounded-full bg-[#FDEDEC] px-2 py-0.5 text-[11px] font-semibold text-[#C0392B]">
              {pendingReportsCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/analytics"
          className={navClass(pathname.startsWith('/admin/analytics'))}
        >
          <TrendingUp className="size-4 shrink-0" strokeWidth={1.75} />
          Analytics
        </Link>

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Site
        </p>

        <Link
          href="/admin/messages"
          className={navClass(pathname.startsWith('/admin/messages'))}
        >
          <MessageCircle className="size-4 shrink-0" strokeWidth={1.75} />
          Messages
          <SupportUnreadBadge />
        </Link>
        <Link
          href="/settings"
          className={navClass(pathname.startsWith('/settings'))}
        >
          <Settings className="size-4 shrink-0" strokeWidth={1.75} />
          Settings
        </Link>
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-[#E5E7EB] p-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[#C0392B] transition-colors hover:bg-[#FDEDEC]"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
          Log out
        </button>
      </div>
    </aside>
  )
}

export function AdminSidebar({ pendingCount, pendingReportsCount }: { pendingCount: number; pendingReportsCount: number }) {
  return (
    <Suspense
      fallback={
        <div className="sticky top-20 h-[calc(100vh-5rem)] w-55 shrink-0 border-r border-[#E5E7EB] bg-white" />
      }
    >
      <SidebarInner pendingCount={pendingCount} pendingReportsCount={pendingReportsCount} />
    </Suspense>
  )
}
