import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/format-relative-time'

export default async function AdminMessagesPage() {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('support_conversations')
    .select('id, status, last_message_at, user_id, users(id, full_name, username, avatar_url)')
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const convIds = (conversations ?? []).map((c) => c.id)

  const lastMessageMap = new Map<string, { content: string; created_at: string }>()
  const unreadMap = new Map<string, number>()

  if (convIds.length > 0) {
    const { data: messages } = await supabase
      .from('support_messages')
      .select('id, conversation_id, content, created_at, is_admin, is_read')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })

    for (const msg of messages ?? []) {
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, {
          content: msg.content,
          created_at: msg.created_at,
        })
      }
      if (!msg.is_admin && !msg.is_read) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) ?? 0) + 1)
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-bold text-[#1F2937]">Support Conversations</h1>

      {!conversations || conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E5E7EB] py-16 text-center">
          <p className="text-sm text-[#6B7280]">No support conversations yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          <ul className="divide-y divide-[#F3F4F6]">
            {conversations.map((conv) => {
              const user = Array.isArray(conv.users) ? conv.users[0] : conv.users
              const lastMsg = lastMessageMap.get(conv.id)
              const unread = unreadMap.get(conv.id) ?? 0
              const initials = (user?.full_name ?? '?')[0].toUpperCase()

              return (
                <li key={conv.id}>
                  <Link
                    href={`/admin/messages/${conv.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#F9FAFB]"
                  >
                    {/* Avatar */}
                    <div className="relative size-10 shrink-0">
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name ?? ''}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#FEF3E2] text-sm font-semibold text-[#F36D21]">
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-[#1F2937]">
                          {user?.full_name ?? 'Unknown user'}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          {unread > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-[#F36D21] text-[11px] font-bold text-white">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                          {lastMsg && (
                            <span className="text-xs text-[#9CA3AF]">
                              {formatRelativeTime(lastMsg.created_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-0.5 truncate text-sm text-[#6B7280]">
                        {lastMsg
                          ? lastMsg.content.length > 60
                            ? `${lastMsg.content.slice(0, 60)}…`
                            : lastMsg.content
                          : 'No messages yet'}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-[#9CA3AF]">@{user?.username}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            conv.status === 'open'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-[#F3F4F6] text-[#6B7280]'
                          }`}
                        >
                          {conv.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
