'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type CoverPhotoUploadProps = {
  userId: string
  initialCoverUrl: string | null
  isOwner: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export function CoverPhotoUpload({
  userId,
  initialCoverUrl,
  isOwner,
}: CoverPhotoUploadProps) {
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

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
    const path = `cover-${userId}-${Date.now()}.${extension}`

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
      .update({ cover_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message)
      setUploading(false)
      return
    }

    setCoverUrl(publicUrl)
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="relative h-36 overflow-hidden bg-gradient-to-r from-[#FDEEDD] to-[#FEF3E2] sm:h-44 md:h-52">
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="size-full object-cover" />
      )}

      {isOwner && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Change cover photo"
            className="group/cover absolute inset-0 flex items-center justify-center transition-colors hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/50"
          >
            <span className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-sm font-medium text-white opacity-0 transition-opacity group-hover/cover:opacity-100">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="size-4" aria-hidden="true" />
              )}
              {uploading ? 'Uploading...' : 'Change cover photo'}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {error && (
        <div className="absolute inset-x-0 bottom-0 bg-[#FDEDEC] px-4 py-2 text-center text-xs text-[#C0392B]">
          {error}
        </div>
      )}
    </div>
  )
}
