import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  const [
    { count: pendingCount },
    { count: pendingReportsCount },
    { count: pendingUserReportsCount },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('user_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <AdminMobileNav
          pendingCount={pendingCount ?? 0}
          pendingReportsCount={pendingReportsCount ?? 0}
          pendingUserReportsCount={pendingUserReportsCount ?? 0}
        />
      </Suspense>

      <div className="flex flex-1 items-start">
        <AdminSidebar
          pendingCount={pendingCount ?? 0}
          pendingReportsCount={pendingReportsCount ?? 0}
          pendingUserReportsCount={pendingUserReportsCount ?? 0}
        />
        <main className="min-w-0 flex-1 bg-[#F9FAFB] p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
