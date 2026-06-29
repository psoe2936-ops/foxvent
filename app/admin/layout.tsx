import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

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

  const { count: pendingCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="flex min-h-screen items-start">
      <AdminSidebar pendingCount={pendingCount ?? 0} />
      <main className="min-w-0 flex-1 bg-[#F9FAFB] p-8">{children}</main>
    </div>
  )
}
