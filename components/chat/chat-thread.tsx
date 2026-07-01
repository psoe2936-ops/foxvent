'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, CheckCheck, Send, Video } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { sanitizeText } from '@/lib/sanitize'
import dynamic from 'next/dynamic'
import { IncomingCallPopup } from '@/components/chat/incoming-call-popup'

const VideoCall = dynamic(
  () => import('@/components/chat/video-call').then((mod) => mod.VideoCall),
  { ssr: false }
)

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
}

type Person = {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
} | null

type Product = {
  id: string
  title: string
  price: number
  images: string[] | null
} | null

type IncomingCall = {
  callerName: string
  callerAvatar: string | null
}

export function ChatThread({
  conversationId,
  currentUserId,
  currentUserFullName,
  currentUserAvatar,
  otherPerson,
  product,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  currentUserFullName: string
  currentUserAvatar: string | null
  otherPerson: Person
  product: Product
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [isOtherPersonTyping, setIsOtherPersonTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const callChannelRef = useRef<RealtimeChannel | null>(null)
  const typingChannelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const supabase = useMemo(() => createClient(), [])

  // Mark messages as read on mount
  useEffect(() => {
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)
      .then(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId])

  // Subscribe to INSERT + UPDATE events on messages (same channel, two handlers)
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update is_read so sender's checkmark flips from gray to amber
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, is_read: payload.new.is_read as boolean }
                : m
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  // Subscribe to incoming call broadcast signals
  useEffect(() => {
    const channel = supabase
      .channel(`call:${conversationId}`)
      .on('broadcast', { event: 'incoming_call' }, (payload) => {
        const { callerId, callerName, callerAvatar } = payload.payload as {
          callerId: string
          callerName: string
          callerAvatar: string | null
        }
        if (callerId !== currentUserId) {
          setIncomingCall({ callerName, callerAvatar })
        }
      })
      .subscribe()

    callChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      callChannelRef.current = null
    }
  }, [conversationId, currentUserId, supabase])

  // Subscribe to typing broadcast signals
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if ((payload.payload as { userId: string }).userId === currentUserId) return
        setIsOtherPersonTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsOtherPersonTyping(false), 3000)
      })
      .on('broadcast', { event: 'stopped_typing' }, (payload) => {
        if ((payload.payload as { userId: string }).userId === currentUserId) return
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        setIsOtherPersonTyping(false)
      })
      .subscribe()

    typingChannelRef.current = channel

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      supabase.removeChannel(channel)
      typingChannelRef.current = null
    }
  }, [conversationId, currentUserId, supabase])

  // Auto-scroll when messages change or typing indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOtherPersonTyping])

  function broadcastTyping() {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now
    void typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId },
    })
  }

  function broadcastStoppedTyping() {
    void typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'stopped_typing',
      payload: { userId: currentUserId },
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInput(val)
    if (val === '') {
      broadcastStoppedTyping()
    } else {
      broadcastTyping()
    }
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')
    broadcastStoppedTyping()

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: sanitizeText(content, 2000),
    })

    if (error) {
      console.error('Failed to send message:', error)
    }

    setSending(false)
  }

  const handleStartCall = async () => {
    if (callChannelRef.current) {
      await callChannelRef.current.send({
        type: 'broadcast',
        event: 'incoming_call',
        payload: {
          callerId: currentUserId,
          callerName: currentUserFullName,
          callerAvatar: currentUserAvatar,
          conversationId,
        },
      })
    }
    setInCall(true)
  }

  return (
    <>
      <div className="flex h-[calc(100vh-160px)] flex-col rounded-2xl border border-[#E5E7EB] bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={otherPerson?.avatar_url || undefined}
            alt=""
            className="size-10 shrink-0 rounded-full bg-[#F3F4F6] object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[#2D2E32]">
              {otherPerson?.full_name}
            </p>
            {product && (
              <p className="truncate text-xs text-[#6B7280]">
                {product.title} · MMK {product.price.toLocaleString()}
              </p>
            )}
          </div>

          {product && (
            <Link
              href={`/products/${product.id}`}
              className="shrink-0 text-xs font-medium text-[#F36D21] hover:underline"
            >
              View listing
            </Link>
          )}

          <button
            onClick={handleStartCall}
            className="ml-2 flex items-center gap-1.5 rounded-lg bg-[#F36D21] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            aria-label="Start video call"
          >
            <Video className="size-4" />
            Video call
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              Say hello and ask about {product?.title ?? 'this item'}.
            </p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      isMine
                        ? 'rounded-br-sm bg-[#F36D21] text-white'
                        : 'rounded-bl-sm bg-[#F3F4F6] text-[#2D2E32]'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Timestamp + read receipt */}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] text-[#9CA3AF]">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMine && (
                      msg.is_read ? (
                        <CheckCheck className="size-3 text-[#F36D21]" />
                      ) : (
                        <Check className="size-3 text-[#9CA3AF]" />
                      )
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Typing indicator */}
          {isOtherPersonTyping && (
            <div className="flex items-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#F3F4F6] px-3 py-2">
                <span
                  className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF]"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF]"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF]"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-[#E5E7EB] p-3">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm outline-none focus:border-[#F36D21]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-full bg-[#F36D21] p-2.5 text-white disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>

      {incomingCall && (
        <IncomingCallPopup
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          onAccept={() => {
            setIncomingCall(null)
            setInCall(true)
          }}
          onDecline={() => setIncomingCall(null)}
        />
      )}

      {inCall && (
        <VideoCall
          conversationId={conversationId}
          onEnd={() => setInCall(false)}
        />
      )}
    </>
  )
}
