import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <span className="text-lg font-bold text-[#2D2E32]">FoxVent</span>
          <span className="rounded-md bg-[#FEF3E2] px-2 py-1 text-xs font-semibold text-[#C26A08]">
            Admin
          </span>

          <nav className="ml-6 flex items-center gap-1">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#2D2E32] hover:bg-[#F3F4F6]"
            >
              Overview
            </Link>
            <Link
              href="/admin/products"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#2D2E32] hover:bg-[#F3F4F6]"
            >
              Products
            </Link>
            <Link
              href="/admin/users"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#2D2E32] hover:bg-[#F3F4F6]"
            >
              Users
            </Link>
          </nav>

          <Link
            href="/"
            className="ml-auto text-sm text-[#6B7280] hover:text-[#2D2E32]"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}