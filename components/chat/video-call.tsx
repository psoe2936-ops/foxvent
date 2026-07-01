'use client'

import { useEffect, useState } from 'react'
import AgoraRTC, {
  AgoraRTCProvider,
  useRTCClient,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
} from 'agora-rtc-react'
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react'

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!

type CallUIProps = {
  conversationId: string
  onEnd: () => void
}

function CallUI({ conversationId, onEnd }: CallUIProps) {
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchToken() {
      setTokenError(false)
      try {
        const res = await fetch('/api/agora-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName: conversationId }),
        })
        if (!res.ok) throw new Error('Token fetch failed')
        const data = await res.json()
        if (!cancelled) setToken(data.token)
      } catch {
        if (!cancelled) setTokenError(true)
      }
    }

    fetchToken()
    return () => {
      cancelled = true
    }
  }, [conversationId, retryCount])

  // All hooks called unconditionally — useJoin uses ready flag to gate the actual join
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn)
  const { localCameraTrack } = useLocalCameraTrack(camOn)
  const remoteUsers = useRemoteUsers()

  useJoin(
    { appid: APP_ID, channel: conversationId, token: token ?? '' },
    !!token,
  )
  usePublish([localMicrophoneTrack, localCameraTrack])

  // Conditional renders after all hooks
  if (!token && !tokenError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="text-sm">Connecting...</p>
        </div>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black text-white">
        <p className="text-sm">Failed to connect. Please try again.</p>
        <button
          onClick={() => {
            setToken(null)
            setRetryCount((c) => c + 1)
          }}
          className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Retry
        </button>
        <button
          onClick={onEnd}
          className="text-sm text-[#9CA3AF] hover:text-white"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex flex-1 gap-1 overflow-hidden p-1">
        <div className="relative flex-1 overflow-hidden rounded-xl bg-[#1a1a1a]">
          {camOn ? (
            <LocalVideoTrack
              track={localCameraTrack}
              play
              className="size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#F36D21] text-2xl font-bold text-white">
                U
              </div>
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">
            You
          </span>
        </div>

        {remoteUsers.length > 0 ? (
          remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="relative flex-1 overflow-hidden rounded-xl bg-[#1a1a1a]"
            >
              <RemoteUser user={user} className="size-full object-cover" />
              <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">
                Them
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl bg-[#1a1a1a]">
            <div className="text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-[#333]">
                <Video className="size-8 text-[#666]" />
              </div>
              <p className="text-sm text-white">Waiting for other person...</p>
              <p className="mt-1 text-xs text-[#666]">
                Ask them to click &quot;Video call&quot; in the chat
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 bg-black py-5">
        <button
          onClick={() => setMicOn((prev) => !prev)}
          className={`flex size-12 items-center justify-center rounded-full transition-colors ${
            micOn ? 'bg-[#333] text-white' : 'bg-[#C0392B] text-white'
          }`}
          aria-label={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </button>

        <button
          onClick={onEnd}
          className="flex size-14 items-center justify-center rounded-full bg-[#C0392B] text-white hover:opacity-90"
          aria-label="End call"
        >
          <PhoneOff className="size-6" />
        </button>

        <button
          onClick={() => setCamOn((prev) => !prev)}
          className={`flex size-12 items-center justify-center rounded-full transition-colors ${
            camOn ? 'bg-[#333] text-white' : 'bg-[#C0392B] text-white'
          }`}
          aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </button>
      </div>
    </div>
  )
}

export function VideoCall({
  conversationId,
  onEnd,
}: {
  conversationId: string
  onEnd: () => void
}) {
  const client = useRTCClient(
    AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' })
  )

  return (
    <AgoraRTCProvider client={client}>
      <CallUI conversationId={conversationId} onEnd={onEnd} />
    </AgoraRTCProvider>
  )
}
