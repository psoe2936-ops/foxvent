'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowUp, MessageCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sanitizeText } from '@/lib/sanitize'
import { FoxIcon } from '@/components/navbar/fox-icon'

type SupportMessage = {
  id: string
  sender_id: string
  is_admin: boolean
  content: string
  created_at: string
}

export function SupportChatBubble({ userId }: { userId: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)
  const supabase = useMemo(() => createClient(), [])

  const isHidden = !userId || pathname.startsWith('/admin')

  // Keep openRef in sync for realtime callback (avoids stale closure)
  useEffect(() => {
    openRef.current = open
  }, [open])

  // On mount: pre-load conversation id + unread badge count
  useEffect(() => {
    if (isHidden) return

    async function init() {
      const { data: conv } = await supabase
        .from('support_conversations')
        .select('id')
        .eq('user_id', userId!)
        .maybeSingle()

      if (!conv) return
      setConversationId(conv.id)

      const { count } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_admin', true)
        .eq('is_read', false)

      setUnreadCount(count ?? 0)
    }

    init()
  }, [isHidden, userId, supabase])

  // When popup opens with a known conversation: load messages + mark admin msgs read
  useEffect(() => {
    if (!open || !conversationId) return

    async function loadMessages() {
      const { data: msgs } = await supabase
        .from('support_messages')
        .select('id, sender_id, is_admin, content, created_at')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })

      setMessages(msgs ?? [])

      void supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId!)
        .eq('is_admin', true)
        .eq('is_read', false)

      setUnreadCount(0)
    }

    loadMessages()
  }, [open, conversationId, supabase])

  // Realtime: subscribe once we have a conversationId
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`support-user:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as SupportMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.is_admin) {
            if (openRef.current) {
              void supabase
                .from('support_messages')
                .update({ is_read: true })
                .eq('id', msg.id)
            } else {
              setUnreadCount((c) => c + 1)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')

    let convId = conversationId

    if (!convId) {
      const { data } = await supabase
        .from('support_conversations')
        .upsert({ user_id: userId!, status: 'open' }, { onConflict: 'user_id' })
        .select('id')
        .single()

      if (data) {
        convId = data.id
        setConversationId(convId)
      }
    }

    if (!convId) {
      setSending(false)
      return
    }

    await supabase.from('support_messages').insert({
      conversation_id: convId,
      sender_id: userId!,
      is_admin: false,
      content: sanitizeText(content, 2000),
    })

    void supabase
      .from('support_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convId)

    setSending(false)
  }

  if (isHidden) return null

  return (
    <>
      {/* Chat popup */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 flex h-[60vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#E5E7EB] bg-white shadow-xl sm:bottom-24 sm:right-6 sm:h-105 sm:w-[320px] sm:rounded-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[#E5E7EB] px-4 py-3">
            <FoxIcon className="size-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#1F2937]">FoxVent Support</p>
              <p className="text-xs text-[#6B7280]">We'll reply as soon as we can</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#1F2937]"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-[#F3F4F6] px-3 py-2 text-sm text-[#1F2937]">
                  👋 Hi! How can we help you today?
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.is_admin ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.is_admin
                      ? 'rounded-bl-sm bg-[#F3F4F6] text-[#1F2937]'
                      : 'rounded-br-sm bg-[#F36D21] text-white'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="mt-0.5 text-[10px] text-[#9CA3AF]">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex shrink-0 items-center gap-2 border-t border-[#E5E7EB] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleSend()
              }}
              placeholder="Write your message..."
              className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm outline-none focus:border-[#F36D21] focus:ring-1 focus:ring-[#F36D21]/20"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 rounded-full bg-[#F36D21] p-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble — hidden on mobile when popup is open */}
      <button
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) setUnreadCount(0)
        }}
        className={`fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#F36D21] shadow-lg transition-transform hover:scale-105 active:scale-95 ${
          open ? 'max-sm:hidden' : ''
        }`}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? (
          <X className="size-6 text-white" />
        ) : (
          <MessageCircle className="size-6 text-white" />
        )}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  )
}
