'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText, sanitizeUsername } from '@/lib/sanitize'

const USERNAME_RE = /^[a-z0-9._]+$/

export async function updateProfile(data: {
  userId: string
  fullName: string
  username: string
  bio: string
  location: string
}): Promise<{ error: string } | { success: true; username: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  if (user.id !== data.userId) return { error: 'Not authorized.' }

  const fullName = data.fullName.trim()
  const username = sanitizeUsername(data.username.trim())
  const bio = data.bio.trim()
  const location = data.location.trim()

  if (!fullName || fullName.length < 2) return { error: 'Full name must be at least 2 characters.' }
  if (fullName.length > 50) return { error: 'Full name must be 50 characters or fewer.' }

  if (!username || username.length < 3) return { error: 'Username must be at least 3 characters.' }
  if (username.length > 30) return { error: 'Username must be 30 characters or fewer.' }
  if (!USERNAME_RE.test(username)) {
    return { error: 'Username may only contain lowercase letters, numbers, dots, and underscores.' }
  }

  if (bio.length > 300) return { error: 'Bio must be 300 characters or fewer.' }
  if (location.length > 100) return { error: 'Location must be 100 characters or fewer.' }

  // Server-side uniqueness check (exclude own row)
  const { data: taken } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()
  if (taken) return { error: 'That username is already taken.' }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      full_name: sanitizeText(fullName, 50),
      username,
      bio: bio ? sanitizeText(bio, 300) : null,
      location: location ? sanitizeText(location, 100) : null,
    })
    .eq('id', user.id)

  if (updateError) return { error: 'Failed to save changes. Please try again.' }

  revalidatePath(`/profile/${username}`)
  return { success: true, username }
}
