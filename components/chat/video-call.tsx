'use client'

import { useState } from 'react'
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
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn)
  const { localCameraTrack } = useLocalCameraTrack(camOn)
  const remoteUsers = useRemoteUsers()

  useJoin({
    appid: APP_ID,
    channel: 'test',
    token: '007eJxTYEieK5MqVCYn2qK05oGpS5Lb4/93K5622yftyzT97uB4YJMCQ1pqYnKakUmScbKJqUlySrKlsVGaaZKpqVmigUGicVIab7RlVkMgI0MUfx4LIwMEgvgsDCWpxSUMDAAEMB4e',
  })

  usePublish([localMicrophoneTrack, localCameraTrack])

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
              <p className="text-sm text-white">
                Waiting for other person...
              </p>
              <p className="mt-1 text-xs text-[#666]">
                Ask them to click "Video call" in the chat
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
          {camOn ? (
            <Video className="size-5" />
          ) : (
            <VideoOff className="size-5" />
          )}
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