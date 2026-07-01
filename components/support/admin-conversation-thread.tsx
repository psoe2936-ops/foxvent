'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUp, CheckCircle, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  sender_id: string
  is_admin: boolean
  content: string
  created_at: string
}

type TargetUser = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
} | null

export function AdminConversationThread({
  conversationId,
  status: initialStatus,
  adminId,
  targetUser,
  initialMessages,
}: {
  conversationId: string
  status: 'open' | 'closed'
  adminId: string
  targetUser: TargetUser
  initialMessages: Message[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const [toggling, setToggling] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`support-admin:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          // Mark incoming user messages as read immediately
          if (!msg.is_admin) {
            void supabase
              .from('support_messages')
              .update({ is_read: true })
              .eq('id', msg.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending || status === 'closed') return
    setSending(true)
    setInput('')

    await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      sender_id: adminId,
      is_admin: true,
      content,
    })

    void supabase
      .from('support_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    setSending(false)
  }

  async function handleToggleStatus() {
    if (toggling) return
    setToggling(true)
    const next = status === 'open' ? 'closed' : 'open'
    await supabase
      .from('support_conversations')
      .update({ status: next })
      .eq('id', conversationId)
    setStatus(next)
    setToggling(false)
  }

  const initials = (targetUser?.full_name ?? '?')[0].toUpperCase()

  return (
    <div className="mx-auto flex max-w-3xl flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/messages')}
            className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="relative size-10 shrink-0">
            {targetUser?.avatar_url ? (
              <Image
                src={targetUser.avatar_url}
                alt={targetUser.full_name ?? ''}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-[#FEF3E2] text-sm font-semibold text-[#F36D21]">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-[#1F2937]">
              {targetUser?.full_name ?? 'Unknown user'}
            </p>
            <p className="text-xs text-[#6B7280]">@{targetUser?.username}</p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              status === 'open'
                ? 'bg-green-50 text-green-600'
                : 'bg-[#F3F4F6] text-[#6B7280]'
            }`}
          >
            {status === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>

        <button
          onClick={handleToggleStatus}
          disabled={toggling}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            status === 'open'
              ? 'border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]'
              : 'bg-[#F36D21] text-white hover:opacity-90'
          }`}
        >
          {status === 'open' ? (
            <>
              <CheckCircle className="size-4" />
              Close conversation
            </>
          ) : (
            <>
              <RotateCcw className="size-4" />
              Reopen
            </>
          )}
        </button>
      </div>

      {/* Thread */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B7280]">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.is_admin
                      ? 'rounded-br-sm bg-[#F36D21] text-white'
                      : 'rounded-bl-sm bg-[#F3F4F6] text-[#1F2937]'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="mt-1 text-[10px] text-[#9CA3AF]">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex shrink-0 items-center gap-2 border-t border-[#E5E7EB] p-3">
          {status === 'closed' ? (
            <p className="flex-1 text-center text-sm text-[#9CA3AF]">
              This conversation is closed.
            </p>
          ) : (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) handleSend()
                }}
                placeholder="Reply as admin..."
                className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm outline-none focus:border-[#F36D21] focus:ring-1 focus:ring-[#F36D21]/20"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="shrink-0 rounded-full bg-[#F36D21] p-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                aria-label="Send reply"
              >
                <ArrowUp className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
