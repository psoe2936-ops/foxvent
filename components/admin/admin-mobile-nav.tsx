'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { FoxIcon } from '@/components/navbar/fox-icon'
import { createClient } from '@/lib/supabase/client'

type AdminMobileNavProps = {
  pendingCount: number
  pendingReportsCount: number
}

export function AdminMobileNav({ pendingCount, pendingReportsCount }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const currentStatus = searchParams.get('status') ?? 'pending'
  const onProductsRoot = pathname === '/admin/products'

  function close() { setOpen(false) }

  async function handleLogout() {
    close()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function navCls(active: boolean) {
    return `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px] ${
      active ? 'bg-[#FEF3E2] text-[#F36D21]' : 'text-[#4B5563] hover:bg-[#F3F4F6]'
    }`
  }

  function statusCls(status: string) {
    return navCls(onProductsRoot && currentStatus === status)
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <FoxIcon className="size-6" />
          <span className="text-sm font-bold text-[#1F2937]">FoxVent</span>
          <span className="rounded-md bg-[#FEF3E2] px-1.5 py-0.5 text-[10px] font-semibold text-[#C26A08]">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]"
          aria-label="Open admin menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Overlay + drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={close}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl lg:hidden">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
              <div className="flex items-center gap-2">
                <FoxIcon className="size-7" />
                <span className="text-sm font-bold text-[#1F2937]">FoxVent Admin</span>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex size-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#F3F4F6]"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
              <Link href="/admin" onClick={close} className={navCls(pathname === '/admin')}>
                <LayoutDashboard className="size-4 shrink-0" />
                Dashboard
              </Link>

              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Listings
              </p>
              <Link href="/admin/products?status=all" onClick={close} className={statusCls('all')}>
                All Listings
              </Link>
              <Link href="/admin/products?status=pending" onClick={close} className={statusCls('pending')}>
                Pending
                {pendingCount > 0 && (
                  <span className="ml-auto rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[11px] font-semibold text-[#C26A08]">
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link href="/admin/products?status=approved" onClick={close} className={statusCls('approved')}>
                Approved
              </Link>
              <Link href="/admin/products?status=rejected" onClick={close} className={statusCls('rejected')}>
                Rejected
              </Link>

              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Manage
              </p>
              <Link href="/admin/users" onClick={close} className={navCls(pathname.startsWith('/admin/users'))}>
                <Users className="size-4 shrink-0" />
                Users
              </Link>
              <Link href="/admin/reports" onClick={close} className={navCls(pathname.startsWith('/admin/reports'))}>
                <BarChart2 className="size-4 shrink-0" />
                Reports
                {pendingReportsCount > 0 && (
                  <span className="ml-auto rounded-full bg-[#FDEDEC] px-2 py-0.5 text-[11px] font-semibold text-[#C0392B]">
                    {pendingReportsCount}
                  </span>
                )}
              </Link>
              <Link href="/admin/analytics" onClick={close} className={navCls(pathname.startsWith('/admin/analytics'))}>
                <TrendingUp className="size-4 shrink-0" />
                Analytics
              </Link>

              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Site
              </p>
              <Link href="/admin/messages" onClick={close} className={navCls(pathname.startsWith('/admin/messages'))}>
                <MessageCircle className="size-4 shrink-0" />
                Messages
              </Link>
              <Link href="/settings" onClick={close} className={navCls(pathname.startsWith('/settings'))}>
                <Settings className="size-4 shrink-0" />
                Settings
              </Link>
            </nav>

            <div className="border-t border-[#E5E7EB] p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#C0392B] transition-colors hover:bg-[#FDEDEC]"
              >
                <LogOut className="size-4 shrink-0" />
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
