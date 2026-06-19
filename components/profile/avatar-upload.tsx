'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AvatarUploadProps = {
  userId: string
  initialAvatarUrl: string | null
  fullName: string
  isOwner: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export function AvatarUpload({
  userId,
  initialAvatarUrl,
  fullName,
  isOwner,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be smaller than 5MB.')
      return
    }

    setError(null)
    setUploading(true)

    const extension = file.name.split('.').pop() || 'jpg'
    const path = `avatar-${userId}-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600' })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setUploading(false)
      return
    }

    setAvatarUrl(publicUrl)
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="relative -mt-10 size-20 shrink-0 sm:-mt-12 sm:size-24">
      <div className="group/avatar relative size-full overflow-hidden rounded-full border-4 border-white shadow-sm">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={fullName} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-[#FEF3E2] text-lg font-bold text-[#C26A08]">
            {initials || '?'}
          </div>
        )}

        {isOwner && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/50"
          >
            <span className="opacity-0 transition-opacity group-hover/avatar:opacity-100">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-white" aria-hidden="true" />
              ) : (
                <Camera className="size-5 text-white" aria-hidden="true" />
              )}
            </span>
          </button>
        )}
      </div>

      {isOwner && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {error && (
        <p className="absolute left-0 top-full mt-1 w-48 text-xs text-[#C0392B]">
          {error}
        </p>
      )}
    </div>
  )
}
