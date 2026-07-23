import { createClient } from '@/lib/supabase/server'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: totalProducts },
    { count: pendingCount },
    { count: approvedTodayCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('approved_at', startOfToday.toISOString()),
  ])

  const stats = [
    { label: 'Total users', value: totalUsers ?? 0, accent: false },
    { label: 'Total products', value: totalProducts ?? 0, accent: false },
    { label: 'Pending review', value: pendingCount ?? 0, accent: true },
    { label: 'Approved today', value: approvedTodayCount ?? 0, accent: false },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2D2E32]">Overview</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        A snapshot of your marketplace right now.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border bg-white p-5 ${
              stat.accent
                ? 'border-[#F36D21]/30 bg-[#FEF3E2]/40'
                : 'border-[#E5E7EB]'
            }`}
          >
            <p className="text-sm text-[#6B7280]">{stat.label}</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                stat.accent ? 'text-[#C26A08]' : 'text-[#2D2E32]'
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}