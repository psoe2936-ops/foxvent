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
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2 } from 'lucide-react'

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
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [micLevel, setMicLevel] = useState(0)

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
    return () => { cancelled = true }
  }, [conversationId, retryCount])

  // All hooks called unconditionally — useJoin/usePublish gate themselves via the ready flag
  const { localMicrophoneTrack, isLoading: micLoading, error: micError } = useLocalMicrophoneTrack(micOn)
  const { localCameraTrack, isLoading: camLoading, error: camError } = useLocalCameraTrack(camOn)
  const remoteUsers = useRemoteUsers()

  useJoin(
    { appid: APP_ID, channel: conversationId, token: token ?? '' },
    !!token,
  )
  usePublish([localMicrophoneTrack, localCameraTrack])

  useEffect(() => {
    console.error('DEBUG Publish status:', {
      micOn,
      hasLocalMicTrack: !!localMicrophoneTrack,
      micTrackEnabled: localMicrophoneTrack?.enabled,
      micMuted: localMicrophoneTrack?.muted,
    })
  }, [micOn, localMicrophoneTrack])

  useEffect(() => {
    remoteUsers.forEach((user) => {
      console.error('DEBUG Remote user audio status:', {
        uid: user.uid,
        hasAudioTrack: !!user.audioTrack,
        audioTrackPlaying: user.audioTrack?.isPlaying,
      })
    })
  }, [remoteUsers])

  useEffect(() => {
    if (localMicrophoneTrack) {
      console.error('DEBUG Mic track created:', {
        enabled: localMicrophoneTrack.enabled,
        muted: localMicrophoneTrack.muted,
        trackLabel: localMicrophoneTrack.getTrackLabel?.(),
      })
    }
  }, [localMicrophoneTrack])

  useEffect(() => {
    if (!localMicrophoneTrack) return
    const interval = setInterval(async () => {
      try {
        const stats = localMicrophoneTrack.getStats()
        console.error('DEBUG Local mic track stats:', stats)
      } catch (e) {
        console.error('DEBUG Failed to get mic stats:', e)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [localMicrophoneTrack])

  useEffect(() => {
    if (!localMicrophoneTrack) return
    const interval = setInterval(() => {
      setMicLevel(localMicrophoneTrack.getVolumeLevel())
    }, 100)
    return () => clearInterval(interval)
  }, [localMicrophoneTrack])

  // Log device errors for debugging
  useEffect(() => {
    if (camError) console.error('Camera error:', camError)
  }, [camError])
  useEffect(() => {
    if (micError) console.error('Mic error:', micError)
  }, [micError])

  // Proactively play each remote audio track and catch autoplay blocks on any
  // browser/device. IRemoteAudioTrack.play() is typed void but returns a Promise
  // at runtime in browsers that implement the Promises-based autoplay policy.
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (!user.audioTrack) return
      const playResult = (user.audioTrack.play as () => void | Promise<void>)()
      if (playResult && typeof (playResult as Promise<void>).catch === 'function') {
        ;(playResult as Promise<void>).catch((err: unknown) => {
          console.error('Audio play failed for user:', user.uid, err)
          setAudioBlocked(true)
        })
      }
    })
  }, [remoteUsers])

  async function handleToggleMic() {
    if (localMicrophoneTrack) {
      await localMicrophoneTrack.setEnabled(!micOn)
    }
    setMicOn((prev) => !prev)
  }

  async function handleToggleCam() {
    if (localCameraTrack) {
      await localCameraTrack.setEnabled(!camOn)
    }
    setCamOn((prev) => !prev)
  }

  function handleUnblockAudio() {
    // Called from a click handler — satisfies user-gesture requirement on all browsers
    remoteUsers.forEach((user) => {
      if (!user.audioTrack) return
      ;(user.audioTrack.play as () => void | Promise<void>)()
    })
    setAudioBlocked(false)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      remoteUsers.forEach((user) => {
        if (user.audioTrack && !user.audioTrack.isPlaying) {
          ;(user.audioTrack.play as () => void | Promise<void>)()
        }
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [remoteUsers])

  // ── Loading / connecting ────────────────────────────────────────────────────
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

  // ── Token error ─────────────────────────────────────────────────────────────
  if (tokenError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black text-white">
        <p className="text-sm">Failed to connect. Please try again.</p>
        <button
          onClick={() => { setToken(null); setRetryCount((c) => c + 1) }}
          className="rounded-lg bg-[#F36D21] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Retry
        </button>
        <button onClick={onEnd} className="text-sm text-[#9CA3AF] hover:text-white">
          Cancel
        </button>
      </div>
    )
  }

  // ── Camera / mic permission denied ──────────────────────────────────────────
  if (camError || micError) {
    const label =
      camError && micError ? 'Camera and microphone' : camError ? 'Camera' : 'Microphone'

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#C0392B]/20">
          <VideoOff className="size-8 text-[#C0392B]" />
        </div>
        <div>
          <p className="text-base font-semibold">{label} access denied</p>
          <p className="mt-2 max-w-xs text-sm text-[#9CA3AF]">
            Please allow access in your browser settings and reload the page to try again.
          </p>
        </div>
        <button
          onClick={onEnd}
          className="mt-2 rounded-lg border border-[#444] px-5 py-2 text-sm text-[#9CA3AF] hover:bg-[#1a1a1a] hover:text-white"
        >
          Leave call
        </button>
      </div>
    )
  }

  // True when tracks are being acquired (mic or cam toggle just happened)
  const isDeviceLoading = (micOn && micLoading) || (camOn && camLoading)

  // ── Main call UI ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Tap-to-enable-audio overlay — appears when mobile autoplay is blocked */}
      {audioBlocked && remoteUsers.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <button
            onClick={handleUnblockAudio}
            className="flex items-center gap-2 rounded-2xl bg-black/70 px-6 py-4 text-white backdrop-blur-sm"
          >
            <Volume2 className="size-6 text-[#F36D21]" />
            <span className="text-sm font-semibold">Tap to enable audio</span>
          </button>
        </div>
      )}

      {/* Mic level debug meter */}
      <div className="absolute left-3 top-14 z-10 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
        <Mic className="size-3 text-white" />
        <div className="h-2 w-20 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-[#F36D21] transition-all duration-100"
            style={{ width: `${Math.min(micLevel * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Device-acquiring indicator */}
      {isDeviceLoading && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <div className="size-3 animate-spin rounded-full border border-white border-t-transparent" />
          <span className="text-xs text-white">Waiting for camera/microphone permission…</span>
        </div>
      )}

      <div className="flex flex-1 gap-1 overflow-hidden p-1">
        {/* Local video tile */}
        <div className="relative flex-1 overflow-hidden rounded-xl bg-[#1a1a1a]">
          {camOn && localCameraTrack ? (
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

        {/* Remote video tiles — playAudio={false} so we own audio play() manually above */}
        {remoteUsers.length > 0 ? (
          remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="relative flex-1 overflow-hidden rounded-xl bg-[#1a1a1a]"
            >
              <RemoteUser user={user} playAudio={false} className="size-full object-cover" />
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

      {/* Call controls */}
      <div className="flex items-center justify-center gap-4 bg-black py-5">
        <button
          onClick={handleToggleMic}
          className={`flex size-12 items-center justify-center rounded-full transition-colors ${
            micOn ? 'bg-[#333] text-white' : 'bg-[#C0392B] text-white'
          }`}
          aria-label={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </button>

        <button
          onClick={handleUnblockAudio}
          className="flex size-12 items-center justify-center rounded-full bg-[#333] text-white"
          aria-label="Fix audio"
        >
          <Volume2 className="size-5" />
        </button>

        <button
          onClick={onEnd}
          className="flex size-14 items-center justify-center rounded-full bg-[#C0392B] text-white hover:opacity-90"
          aria-label="End call"
        >
          <PhoneOff className="size-6" />
        </button>

        <button
          onClick={handleToggleCam}
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
