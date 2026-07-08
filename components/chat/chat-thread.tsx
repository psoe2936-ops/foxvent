'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Check, CheckCheck, MoreVertical, Send, Shield, Video, X } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/chat/actions'
import { makeOffer, type Offer } from '@/app/offers/actions'
import dynamic from 'next/dynamic'
import { IncomingCallPopup } from '@/components/chat/incoming-call-popup'
import { ReportUserModal } from '@/components/users/report-user-modal'
import { OfferCard } from '@/components/chat/offer-card'
import { ReviewModal } from '@/components/reviews/review-modal'

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
  message_type: 'text' | 'call_log'
  call_duration_seconds: number | null
  call_status: 'completed' | 'missed' | 'declined' | null
}

function formatCallDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
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

type TimelineItem =
  | { type: 'message'; id: string; data: Message; created_at: string }
  | { type: 'offer'; id: string; data: Offer; created_at: string }

export function ChatThread({
  conversationId,
  currentUserId,
  currentUserFullName,
  currentUserAvatar,
  otherPerson,
  product,
  initialMessages,
  initialOffers = [],
  isBuyer = false,
  showOfferOnMount = false,
  hasReviewed = false,
  iBlockedThem: initialIBlockedThem = false,
  theyBlockedMe = false,
  autoAccept = false,
}: {
  conversationId: string
  currentUserId: string
  currentUserFullName: string
  currentUserAvatar: string | null
  otherPerson: Person
  product: Product
  initialMessages: Message[]
  initialOffers?: Offer[]
  isBuyer?: boolean
  showOfferOnMount?: boolean
  hasReviewed?: boolean
  iBlockedThem?: boolean
  theyBlockedMe?: boolean
  autoAccept?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [offers, setOffers] = useState<Offer[]>(initialOffers)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [isOtherPersonTyping, setIsOtherPersonTyping] = useState(false)

  // Offer state
  const [showOfferPanel, setShowOfferPanel] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerError, setOfferError] = useState<string | null>(null)
  const [sendingOffer, setSendingOffer] = useState(false)

  // Block state — server-seeded, updated optimistically from kebab menu
  const [iBlockedThem, setIBlockedThem] = useState(initialIBlockedThem)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [blockPending, startBlockTransition] = useTransition()

  // Kebab menu state
  const [kebabOpen, setKebabOpen] = useState(false)
  const [kebabMode, setKebabMode] = useState<'menu' | 'block-confirm'>('menu')
  const [blockError, setBlockError] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [justReviewed, setJustReviewed] = useState(false)
  const kebabRef = useRef<HTMLDivElement>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const callChannelRef = useRef<RealtimeChannel | null>(null)
  const typingChannelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const supabase = useMemo(() => createClient(), [])
  const pathname = usePathname()
  const router = useRouter()

  const isInputDisabled = iBlockedThem || theyBlockedMe || sending

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({ type: 'message' as const, id: m.id, data: m, created_at: m.created_at })),
      ...offers.map((o) => ({ type: 'offer' as const, id: o.id, data: o, created_at: o.created_at })),
    ]
    return items.sort((a, b) => a.created_at.localeCompare(b.created_at))
  }, [messages, offers])

  // Close kebab on outside click
  useEffect(() => {
    if (!kebabOpen) return
    function onOutside(e: MouseEvent) {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setKebabOpen(false)
        setKebabMode('menu')
        setBlockError(null)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [kebabOpen])

  useEffect(() => setMounted(true), [])

  // Auto-open the call when the user arrived via the global incoming-call popup
  useEffect(() => {
    if (autoAccept) {
      setInCall(true)
      router.replace(pathname, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-open the offer panel when the user arrived via ?offer=1
  useEffect(() => {
    if (showOfferOnMount && isBuyer) {
      setShowOfferPanel(true)
      router.replace(pathname, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Subscribe to INSERT + UPDATE events on messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, is_read: payload.new.is_read as boolean } : m
            )
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase])

  // Subscribe to INSERT + UPDATE events on offers
  useEffect(() => {
    const channel = supabase
      .channel(`offers:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'offers', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setOffers((prev) => {
            if (prev.some((o) => o.id === payload.new.id)) return prev
            return [...prev, payload.new as Offer]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'offers', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setOffers((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...(payload.new as Offer) } : o
            )
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase])

  // Subscribe to incoming call broadcast signals
  useEffect(() => {
    const channel = supabase
      .channel(`call:${conversationId}`)
      .on('broadcast', { event: 'incoming_call' }, (payload) => {
        const { callerId, callerName, callerAvatar } = payload.payload as {
          callerId: string; callerName: string; callerAvatar: string | null
        }
        if (callerId !== currentUserId) setIncomingCall({ callerName, callerAvatar })
      })
      .subscribe()
    callChannelRef.current = channel
    return () => { supabase.removeChannel(channel); callChannelRef.current = null }
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

  // Auto-scroll when timeline changes or typing indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [timeline, isOtherPersonTyping])

  function broadcastTyping() {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now
    void typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUserId } })
  }

  function broadcastStoppedTyping() {
    void typingChannelRef.current?.send({ type: 'broadcast', event: 'stopped_typing', payload: { userId: currentUserId } })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInput(val)
    if (rateLimitError) setRateLimitError(null)
    if (val === '') broadcastStoppedTyping(); else broadcastTyping()
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content || sending || isInputDisabled) return

    setSending(true)
    setRateLimitError(null)
    setInput('')
    broadcastStoppedTyping()

    const result = await sendMessage({ conversationId, content })

    if ('error' in result) {
      setRateLimitError(result.error)
      setInput(content)
    }

    setSending(false)
  }

  const handleSubmitOffer = async () => {
    const amount = Number(offerAmount)
    if (!amount || amount <= 0) { setOfferError('Enter a valid amount.'); return }

    setSendingOffer(true)
    setOfferError(null)

    const result = await makeOffer({ conversationId, amount })

    setSendingOffer(false)

    if ('error' in result) {
      setOfferError(result.error)
      return
    }

    // Optimistically add; realtime will deduplicate on INSERT
    setOffers((prev) => {
      if (prev.some((o) => o.id === result.offer.id)) return prev
      return [...prev, result.offer]
    })
    setOfferAmount('')
    setShowOfferPanel(false)
  }

  function handleOfferUpdate(updated: Offer) {
    setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
  }

  const handleStartCall = async () => {
    const callPayload = {
      type: 'broadcast' as const,
      event: 'incoming_call',
      payload: { callerId: currentUserId, callerName: currentUserFullName, callerAvatar: currentUserAvatar, conversationId },
    }
    // Broadcast to the in-thread channel (picked up if recipient is already in this chat)
    if (callChannelRef.current) {
      await callChannelRef.current.send(callPayload)
    }
    // Also broadcast to the global channel (picked up by GlobalCallListener on any page)
    await supabase.channel(`gcall:${conversationId}`).send(callPayload)
    setInCall(true)
  }

  function handleBlockConfirm() {
    setBlockError(null)
    startBlockTransition(async () => {
      if (iBlockedThem) {
        const { error: dbErr } = await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', otherPerson!.id)
        if (dbErr) { setBlockError('Failed. Please try again.'); return }
        setIBlockedThem(false)
      } else {
        const { error: dbErr } = await supabase
          .from('blocks')
          .upsert({ blocker_id: currentUserId, blocked_id: otherPerson!.id }, { onConflict: 'blocker_id,blocked_id' })
        if (dbErr) { setBlockError('Failed. Please try again.'); return }
        setIBlockedThem(true)
      }
      setKebabOpen(false)
      setKebabMode('menu')
    })
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
            <p className="truncate font-medium text-[#2D2E32]">{otherPerson?.full_name}</p>
            {product && (
              <p className="truncate text-xs text-[#6B7280]">
                {product.title} · MMK {mounted ? product.price.toLocaleString() : product.price}
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

          {/* Kebab menu */}
          {otherPerson && (
            <div ref={kebabRef} className="relative ml-1 shrink-0">
              <button
                type="button"
                onClick={() => { setKebabOpen((v) => !v); setKebabMode('menu'); setBlockError(null) }}
                className="flex size-8 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
                aria-label="More options"
              >
                <MoreVertical className="size-4" />
              </button>

              {kebabOpen && (
                <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
                  {kebabMode === 'menu' ? (
                    <>
                      <Link
                        href={`/profile/${otherPerson.username}`}
                        onClick={() => setKebabOpen(false)}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
                      >
                        View profile
                      </Link>
                      <div className="h-px bg-[#F3F4F6]" />
                      <button
                        type="button"
                        onClick={() => setKebabMode('block-confirm')}
                        className={`flex w-full items-center px-4 py-2.5 text-sm hover:bg-[#F9FAFB] ${iBlockedThem ? 'text-[#C0392B]' : 'text-[#374151]'}`}
                      >
                        {iBlockedThem ? `Unblock @${otherPerson.username}` : `Block @${otherPerson.username}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setKebabOpen(false); setReportOpen(true) }}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
                      >
                        Report @{otherPerson.username}
                      </button>
                      {isBuyer && (
                        <>
                          <div className="h-px bg-[#F3F4F6]" />
                          {hasReviewed || justReviewed ? (
                            <span className="flex w-full items-center px-4 py-2.5 text-sm text-[#9CA3AF]">
                              ✓ Reviewed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setKebabOpen(false); setReviewOpen(true) }}
                              className="flex w-full items-center px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
                            >
                              Rate seller
                            </button>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-3">
                      <p className="text-sm font-medium text-[#1F2937]">
                        {iBlockedThem ? `Unblock @${otherPerson.username}?` : `Block @${otherPerson.username}?`}
                      </p>
                      {!iBlockedThem && (
                        <p className="mt-1 text-xs text-[#6B7280]">
                          They won&apos;t be able to message you. Unblock anytime from Settings.
                        </p>
                      )}
                      {blockError && <p className="mt-1 text-xs text-[#C0392B]">{blockError}</p>}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setKebabMode('menu'); setBlockError(null) }}
                          disabled={blockPending}
                          className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleBlockConfirm}
                          disabled={blockPending}
                          className="flex-1 rounded-lg bg-[#C0392B] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                        >
                          {blockPending ? '…' : iBlockedThem ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Safety notice — always visible */}
        <div className="flex shrink-0 items-start gap-2 border-b border-[#E5E7EB] bg-[#FEF3E2] px-4 py-2">
          <Shield className="mt-0.5 size-3.5 shrink-0 text-[#C26A08]" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed text-[#C26A08]">
            For your safety: meet in person and inspect items before paying when possible. If arranging remote payment, only deal with sellers you trust.
          </p>
        </div>

        {/* Messages + offers timeline */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {timeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              Say hello and ask about {product?.title ?? 'this item'}.
            </p>
          ) : (
            timeline.map((item) => {
              if (item.type === 'offer') {
                return (
                  <OfferCard
                    key={item.id}
                    offer={item.data}
                    currentUserId={currentUserId}
                    onUpdate={handleOfferUpdate}
                  />
                )
              }

              const msg = item.data

              if (msg.message_type === 'call_log') {
                return (
                  <div key={item.id} className="flex justify-center py-2">
                    <div className="flex items-center gap-2 rounded-full bg-[#F3F4F6] px-4 py-2 text-xs text-[#6B7280]">
                      <Video className="size-3.5" />
                      {msg.call_status === 'completed' && (
                        <span>Video call · {formatCallDuration(msg.call_duration_seconds ?? 0)}</span>
                      )}
                      {msg.call_status === 'missed' && (
                        <span className="text-[#C0392B]">Missed video call</span>
                      )}
                      {msg.call_status === 'declined' && (
                        <span className="text-[#C0392B]">Video call declined</span>
                      )}
                    </div>
                  </div>
                )
              }

              const isMine = msg.sender_id === currentUserId
              return (
                <div key={item.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      isMine
                        ? 'rounded-br-sm bg-[#F36D21] text-white'
                        : 'rounded-bl-sm bg-[#F3F4F6] text-[#2D2E32]'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] text-[#9CA3AF]">
                      {mounted ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {isMine && (
                      msg.is_read
                        ? <CheckCheck className="size-3 text-[#F36D21]" />
                        : <Check className="size-3 text-[#9CA3AF]" />
                    )}
                  </div>
                </div>
              )
            })
          )}

          {isOtherPersonTyping && (
            <div className="flex items-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#F3F4F6] px-3 py-2">
                <span className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF]" style={{ animationDelay: '0ms' }} />
                <span className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF]" style={{ animationDelay: '150ms' }} />
                <span className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Block banners — shown instead of normal input when blocked */}
        {iBlockedThem ? (
          <div className="flex shrink-0 items-center justify-between border-t border-[#E5E7EB] bg-[#FEF3E2] px-4 py-3">
            <p className="text-xs text-[#C26A08]">
              You&apos;ve blocked @{otherPerson?.username}. They cannot send you messages.
            </p>
            <button
              type="button"
              onClick={() => { setKebabMode('block-confirm'); setKebabOpen(true) }}
              className="ml-3 shrink-0 text-xs font-medium text-[#C0392B] underline hover:no-underline"
            >
              Unblock
            </button>
          </div>
        ) : theyBlockedMe ? (
          <div className="flex shrink-0 items-center border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
            <p className="text-xs text-[#9CA3AF]">You cannot send messages to this user.</p>
          </div>
        ) : (
          /* Normal input */
          <div className="flex shrink-0 flex-col border-t border-[#E5E7EB]">
            {/* Offer input panel — buyer only */}
            {isBuyer && showOfferPanel && (
              <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#2D2E32]">Make an offer</p>
                  <button
                    type="button"
                    onClick={() => { setShowOfferPanel(false); setOfferAmount(''); setOfferError(null) }}
                    className="text-[#9CA3AF] hover:text-[#6B7280]"
                    aria-label="Close offer panel"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#6B7280]">
                    MMK
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={offerAmount}
                    onChange={(e) => { setOfferAmount(e.target.value); setOfferError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitOffer() }}
                    placeholder="Your offer amount"
                    disabled={sendingOffer}
                    className="w-full rounded-lg border border-[#E5E7EB] py-2 pl-14 pr-3 text-sm outline-none focus:border-[#F36D21] disabled:opacity-50"
                  />
                </div>
                {offerError && <p className="mt-1 text-xs text-[#C0392B]">{offerError}</p>}
                <button
                  type="button"
                  onClick={handleSubmitOffer}
                  disabled={!offerAmount || sendingOffer}
                  className="mt-2 w-full rounded-lg bg-[#F36D21] py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {sendingOffer ? 'Submitting…' : 'Submit offer'}
                </button>
              </div>
            )}

            {rateLimitError && (
              <p className="px-4 pt-2 text-[11px] text-[#C0392B]">{rateLimitError}</p>
            )}
            <div className="flex items-center gap-2 p-3">
              {isBuyer && !showOfferPanel && (
                <button
                  type="button"
                  onClick={() => setShowOfferPanel(true)}
                  className="shrink-0 rounded-lg border border-[#F36D21] px-2.5 py-2 text-xs font-semibold text-[#F36D21] hover:bg-[#FEF3E2]"
                >
                  💰 Offer
                </button>
              )}
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                placeholder="Type a message..."
                disabled={isInputDisabled}
                className="flex-1 rounded-full border border-[#E5E7EB] px-4 py-2 text-sm outline-none focus:border-[#F36D21] disabled:opacity-50"
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
        )}
      </div>

      {incomingCall && (
        <IncomingCallPopup
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          conversationId={conversationId}
          currentUserId={currentUserId}
          onAccept={() => { setIncomingCall(null); setInCall(true) }}
          onDecline={() => setIncomingCall(null)}
        />
      )}

      {inCall && (
        <VideoCall conversationId={conversationId} currentUserId={currentUserId} onEnd={() => setInCall(false)} />
      )}

      {reportOpen && otherPerson && (
        <ReportUserModal
          targetUserId={otherPerson.id}
          targetUsername={otherPerson.username}
          reporterId={currentUserId}
          conversationId={conversationId}
          onClose={() => setReportOpen(false)}
        />
      )}

      {reviewOpen && otherPerson && (
        <ReviewModal
          sellerId={otherPerson.id}
          sellerName={otherPerson.full_name}
          productId={product?.id}
          productTitle={product?.title}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => setJustReviewed(true)}
        />
      )}
    </>
  )
}
