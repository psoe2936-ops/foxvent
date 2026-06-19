'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type EditProfileModalProps = {
  profile: {
    id: string
    full_name: string
    username: string
    bio: string | null
    location: string | null
  }
}

export function EditProfileModal({ profile }: EditProfileModalProps) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name)
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const closeModal = () => {
    if (loading) return
    setOpen(false)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedFullName = fullName.trim()
    const trimmedUsername = username.trim().toLowerCase()
    const trimmedLocation = location.trim()
    const trimmedBio = bio.trim()

    if (!trimmedFullName || !trimmedUsername) {
      setError('Full name and username are required.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: trimmedFullName,
        username: trimmedUsername,
        bio: trimmedBio || null,
        location: trimmedLocation || null,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError(
        updateError.code === '23505'
          ? 'That username is already taken.'
          : updateError.message
      )
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)

    if (trimmedUsername !== profile.username) {
      router.push(`/profile/${trimmedUsername}`)
    }
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#2D2E32] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
      >
        <Pencil className="size-4" aria-hidden="true" />
        Edit profile
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-4 top-4 text-[#9CA3AF] transition-colors hover:text-[#2D2E32]"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            <h2
              id="edit-profile-title"
              className="text-lg font-bold text-[#2D2E32]"
            >
              Edit profile
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <Field label="Full name">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21]"
                />
              </Field>

              <Field label="Username">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value.toLowerCase().replace(/\s+/g, ''))
                  }
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none focus:border-[#F36D21]"
                />
              </Field>

              <Field label="Location">
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="City, Country"
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21]"
                />
              </Field>

              <Field label="Bio">
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  maxLength={280}
                  placeholder="Tell people a bit about yourself"
                  className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#2D2E32] outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21]"
                />
              </Field>

              {error && (
                <div className="rounded-lg bg-[#FDEDEC] px-3 py-2 text-xs text-[#C0392B]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E0631D] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[#2D2E32]">{label}</span>
      {children}
    </label>
  )
}
