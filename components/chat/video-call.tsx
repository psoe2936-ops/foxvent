'use client'

import { useEffect, useRef, useState } from 'react'
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
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, SwitchCamera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!

type CallUIProps = {
  conversationId: string
  currentUserId: string
  onEnd: () => void
}

function CallUI({ conversationId, currentUserId, onEnd }: CallUIProps) {
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const callStartTimeRef = useRef<number>(0)

  useEffect(() => {
    callStartTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    AgoraRTC.getCameras()
      .then((cameras) => setHasMultipleCameras(cameras.length > 1))
      .catch(() => {})
  }, [])

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
    if (!localMicrophoneTrack) return
    const interval = setInterval(() => {
      setMicLevel(localMicrophoneTrack.getVolumeLevel())
    }, 100)
    return () => clearInterval(interval)
  }, [localMicrophoneTrack])

  useEffect(() => {
    if (camError) console.error('Camera error:', camError)
  }, [camError])
  useEffect(() => {
    if (micError) console.error('Mic error:', micError)
  }, [micError])

  // Proactively play each remote audio track
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

  // Silent auto-retry for stalled audio
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

  const handleEndCall = async () => {
    const startedAt = callStartTimeRef.current || Date.now()
    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000)
    const supabase = createClient()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: '',
      message_type: 'call_log',
      call_duration_seconds: durationSeconds,
      call_status: durationSeconds < 5 ? 'missed' : 'completed',
    })
    onEnd()
  }

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
    remoteUsers.forEach((user) => {
      if (!user.audioTrack) return
      ;(user.audioTrack.play as () => void | Promise<void>)()
    })
    setAudioBlocked(false)
  }

  const handleFlipCamera = async () => {
    if (!localCameraTrack || !camOn) return
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    try {
      const cameras = await AgoraRTC.getCameras()
      const target = cameras.find((cam) =>
        newMode === 'environment'
          ? /back|rear|environment/i.test(cam.label)
          : /front|user|face/i.test(cam.label)
      )
      if (target) {
        await localCameraTrack.setDevice(target.deviceId)
        setFacingMode(newMode)
      }
    } catch (err) {
      console.error('Camera flip failed:', err)
    }
  }

  // ── Loading / connecting ────────────────────────────────────────────────────
  if (!token && !tokenError) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
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
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black text-white">
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
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
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

  const isDeviceLoading = (micOn && micLoading) || (camOn && camLoading)
  const micLevelMeter = (
    <div className="flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
      <Mic className="size-3 text-white" />
      <div className="h-2 w-16 overflow-hidden rounded-full bg-white/20 sm:w-20">
        <div
          className="h-full bg-[#F36D21] transition-all duration-100"
          style={{ width: `${Math.min(micLevel * 100, 100)}%` }}
        />
      </div>
    </div>
  )

  // ── Main call UI — Messenger-style ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] bg-black" style={{ height: '100dvh' }}>

      {/* === FULLSCREEN BACKGROUND VIDEO === */}
      {remoteUsers.length > 0 ? (
        /* Remote video fills the entire screen */
        <div className="absolute inset-0">
          <RemoteUser
            user={remoteUsers[0]}
            playAudio={false}
            className="size-full object-cover"
          />
        </div>
      ) : (
        /* No remote user yet — local video fills the screen */
        <div className="absolute inset-0">
          {camOn && localCameraTrack ? (
            <LocalVideoTrack track={localCameraTrack} play className="size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
              <div className="flex size-24 items-center justify-center rounded-full bg-[#F36D21] text-4xl font-bold text-white">
                U
              </div>
            </div>
          )}
        </div>
      )}

      {/* === TOP GRADIENT + STATUS TEXT === */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent pb-10 pt-12 px-5">
        {remoteUsers.length === 0 && (
          <p className="text-sm text-white/80">Waiting for other person to join…</p>
        )}
      </div>

      {/* === LOCAL PIP — top-right, only when remote user is present === */}
      {remoteUsers.length > 0 && (
        <div className="absolute right-4 top-4 z-10 h-40 w-28 overflow-hidden rounded-2xl border-2 border-white/30 shadow-lg sm:h-52 sm:w-36">
          {camOn && localCameraTrack ? (
            <LocalVideoTrack track={localCameraTrack} play className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-[#1a1a1a]">
              <VideoOff className="size-7 text-white/40" />
            </div>
          )}
          <div className="absolute inset-x-2 bottom-2 origin-bottom-right scale-75 sm:scale-100">
            {micLevelMeter}
          </div>
        </div>
      )}

      {/* Mic level meter */}
      {remoteUsers.length === 0 && (
        <div className="absolute left-3 top-14 z-10 origin-top-left scale-75 sm:scale-100">
          {micLevelMeter}
        </div>
      )}

      {/* Device acquiring indicator */}
      {isDeviceLoading && (
        <div className="absolute left-3 top-24 z-10 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <div className="size-3 animate-spin rounded-full border border-white border-t-transparent" />
          <span className="text-xs text-white">Waiting for camera/microphone…</span>
        </div>
      )}

      {/* === Tap-to-enable-audio overlay === */}
      {audioBlocked && remoteUsers.length > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <button
            onClick={handleUnblockAudio}
            className="flex items-center gap-2 rounded-2xl bg-black/70 px-6 py-4 text-white backdrop-blur-sm"
          >
            <Volume2 className="size-6 text-[#F36D21]" />
            <span className="text-sm font-semibold">Tap to enable audio</span>
          </button>
        </div>
      )}

      {/* === CONTROLS BAR — absolute bottom, always visible, safe-area aware === */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[70] bg-gradient-to-t from-black/70 to-transparent pt-20 pb-8"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-5">
          {/* Camera flip — only on devices with multiple cameras */}
          {hasMultipleCameras && (
            <button
              onClick={handleFlipCamera}
              disabled={!camOn}
              aria-label="Flip camera"
              className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md disabled:opacity-40"
            >
              <SwitchCamera className="size-6" />
            </button>
          )}

          {/* Mic toggle */}
          <button
            onClick={handleToggleMic}
            aria-label={micOn ? 'Mute' : 'Unmute'}
            className={`flex size-14 items-center justify-center rounded-full backdrop-blur-md ${
              micOn ? 'bg-white/20 text-white' : 'bg-white text-black'
            }`}
          >
            {micOn ? <Mic className="size-6" /> : <MicOff className="size-6" />}
          </button>

          {/* End call — larger red button */}
          <button
            onClick={handleEndCall}
            aria-label="End call"
            className="flex size-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
          >
            <PhoneOff className="size-7" />
          </button>

          {/* Camera toggle */}
          <button
            onClick={handleToggleCam}
            aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
            className={`flex size-14 items-center justify-center rounded-full backdrop-blur-md ${
              camOn ? 'bg-white/20 text-white' : 'bg-white text-black'
            }`}
          >
            {camOn ? <Video className="size-6" /> : <VideoOff className="size-6" />}
          </button>

          {/* Fix audio */}
          <button
            onClick={handleUnblockAudio}
            aria-label="Fix audio"
            className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md"
          >
            <Volume2 className="size-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function VideoCall({
  conversationId,
  currentUserId,
  onEnd,
}: {
  conversationId: string
  currentUserId: string
  onEnd: () => void
}) {
  const client = useRTCClient(
    AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' })
  )

  useEffect(() => {
    window.dispatchEvent(new Event('foxvent-call-started'))
    return () => {
      window.dispatchEvent(new Event('foxvent-call-ended'))
    }
  }, [])

  return (
    <AgoraRTCProvider client={client}>
      <CallUI conversationId={conversationId} currentUserId={currentUserId} onEnd={onEnd} />
    </AgoraRTCProvider>
  )
}
