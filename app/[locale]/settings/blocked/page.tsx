import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UnblockButton } from '@/components/users/unblock-button'

export default async function BlockedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=1')

  const { data: blocks } = await supabase
    .from('blocks')
    .select('id, blocked_id, created_at, blocked:users!blocked_id(id, username, full_name, avatar_url)')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-4">
        <Link href="/settings" className="text-sm text-[#9CA3AF] hover:text-[#6B7280]">
          ← Settings
        </Link>
      </div>
      <h1 className="text-xl font-bold text-[#1F2937]">Blocked users</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Blocked users cannot message you or see your listings.
      </p>

      {!blocks || blocks.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
          <Shield className="size-10 text-[#D1D5DB]" />
          <p className="mt-3 text-sm font-medium text-[#4B5563]">No blocked users</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Users you block will appear here. You can unblock them at any time.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-[#F3F4F6] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          {(blocks as any[]).map((block) => {
            const person = Array.isArray(block.blocked) ? block.blocked[0] : block.blocked
            const blockedOn = new Date(block.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            return (
              <li key={block.id} className="flex items-center gap-3 px-4 py-3">
                {person?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.avatar_url}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-sm font-semibold text-[#9CA3AF]">
                    {(person?.full_name ?? person?.username ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1F2937]">
                    {person?.full_name ?? person?.username ?? 'Unknown user'}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    @{person?.username ?? '—'} · Blocked {blockedOn}
                  </p>
                </div>
                <UnblockButton blockerId={user.id} blockedId={block.blocked_id} />
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
