import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    { count: totalUsers },
    { count: newUsersWeek },
    { count: newUsersMonth },
    { count: totalProducts },
    { count: approvedCount },
    { count: pendingCount },
    { count: rejectedCount },
    { count: totalConversations },
    { count: totalMessages },
    { count: pendingReports },
    { data: allProducts },
    { data: categories },
    { data: recentSignups },
    { data: topProducts },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString()),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString()),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('products').select('category_id').eq('status', 'approved'),
    supabase.from('categories').select('id, name').order('name'),
    supabase
      .from('users')
      .select('id, username, full_name, avatar_url, created_at')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('products')
      .select('id, title, images, views_count, users(username)')
      .eq('status', 'approved')
      .order('views_count', { ascending: false })
      .limit(10),
  ])

  // Build category stats from product category_id grouping
  const categoryCounts = new Map<string, number>()
  for (const p of allProducts ?? []) {
    if (p.category_id) {
      categoryCounts.set(p.category_id, (categoryCounts.get(p.category_id) ?? 0) + 1)
    }
  }
  const categoryStats = (categories ?? [])
    .map((cat: { id: string; name: string }) => ({
      name: cat.name,
      count: categoryCounts.get(cat.id) ?? 0,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)

  const maxCategoryCount = categoryStats[0]?.count ?? 1

  function StatCard({
    label,
    value,
    sub,
  }: {
    label: string
    value: number | string
    sub?: string
  }) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
          {label}
        </p>
        <p className="mt-1.5 text-3xl font-bold text-[#1F2937]">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-[#6B7280]">{sub}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[#1F2937]">Analytics</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Real-time platform overview.</p>
      </div>

      {/* Pending reports alert */}
      {(pendingReports ?? 0) > 0 && (
        <Link
          href="/admin/reports"
          className="flex items-center justify-between rounded-xl border border-[#FDEDEC] bg-[#FDEDEC] px-4 py-3 hover:opacity-90"
        >
          <p className="text-sm font-medium text-[#C0392B]">
            {pendingReports} pending report{pendingReports === 1 ? '' : 's'} need review
          </p>
          <span className="text-xs font-semibold text-[#C0392B]">View →</span>
        </Link>
      )}

      {/* Overview stats */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#6B7280]">Overview</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total users"
            value={(totalUsers ?? 0).toLocaleString()}
            sub={`+${newUsersWeek ?? 0} this week · +${newUsersMonth ?? 0} this month`}
          />
          <StatCard
            label="Total listings"
            value={(totalProducts ?? 0).toLocaleString()}
            sub={`${approvedCount ?? 0} approved · ${pendingCount ?? 0} pending · ${rejectedCount ?? 0} rejected`}
          />
          <StatCard
            label="Conversations"
            value={(totalConversations ?? 0).toLocaleString()}
          />
          <StatCard
            label="Messages sent"
            value={(totalMessages ?? 0).toLocaleString()}
          />
        </div>
      </div>

      {/* Listings breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[#6B7280]">Listings by status</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Approved', count: approvedCount ?? 0, color: 'bg-[#E8F5E9]', text: 'text-[#1A7A4A]' },
            { label: 'Pending', count: pendingCount ?? 0, color: 'bg-[#FEF3E2]', text: 'text-[#C26A08]' },
            { label: 'Rejected', count: rejectedCount ?? 0, color: 'bg-[#FDEDEC]', text: 'text-[#C0392B]' },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border border-[#E5E7EB] ${item.color} p-5`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${item.text}`}>
                {item.label}
              </p>
              <p className={`mt-1.5 text-3xl font-bold ${item.text}`}>
                {item.count.toLocaleString()}
              </p>
              <p className={`mt-0.5 text-xs ${item.text} opacity-70`}>
                {(totalProducts ?? 0) > 0
                  ? `${Math.round((item.count / (totalProducts ?? 1)) * 100)}% of all`
                  : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top categories bar chart */}
      {categoryStats.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1F2937]">Top categories</h2>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">By approved listing count</p>
          <div className="mt-5 space-y-3">
            {categoryStats.map((cat) => {
              const pct = Math.round((cat.count / maxCategoryCount) * 100)
              const totalPct =
                (approvedCount ?? 0) > 0
                  ? Math.round((cat.count / (approvedCount ?? 1)) * 100)
                  : 0
              return (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1F2937]">{cat.name}</span>
                    <span className="text-[#9CA3AF]">
                      {cat.count} ({totalPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div
                      className="h-full rounded-full bg-[#F36D21]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent signups */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1F2937]">New users this week</h2>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">Last 7 days</p>
          {!recentSignups || recentSignups.length === 0 ? (
            <p className="mt-4 text-sm text-[#9CA3AF]">No new signups this week.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentSignups.map(
                (u: {
                  id: string
                  username: string
                  full_name: string | null
                  avatar_url: string | null
                  created_at: string
                }) => (
                  <li key={u.id} className="flex items-center gap-3">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="size-8 shrink-0 rounded-full bg-[#F3F4F6] object-cover"
                      />
                    ) : (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#6B7280]">
                        {(u.full_name?.[0] ?? u.username?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1F2937]">
                        {u.full_name ?? u.username}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">@{u.username}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[#9CA3AF]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        {/* Most viewed products */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1F2937]">Most viewed listings</h2>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">Top 10 by view count</p>
          {!topProducts || topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-[#9CA3AF]">No approved listings yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map(
                (p: {
                  id: string
                  title: string
                  images: string[] | null
                  views_count: number | null
                  users: { username: string } | { username: string }[] | null
                }) => {
                  const seller = Array.isArray(p.users) ? p.users[0] : p.users
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-3 rounded-lg p-1 hover:bg-[#F9FAFB]"
                      >
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0]}
                            alt=""
                            className="size-9 shrink-0 rounded-lg bg-[#F3F4F6] object-cover"
                          />
                        ) : (
                          <div className="size-9 shrink-0 rounded-lg bg-[#F3F4F6]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#1F2937]">
                            {p.title}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">@{seller?.username}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-semibold text-[#6B7280]">
                          {(p.views_count ?? 0).toLocaleString()} views
                        </span>
                      </Link>
                    </li>
                  )
                }
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
