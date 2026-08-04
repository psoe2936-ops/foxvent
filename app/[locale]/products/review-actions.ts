'use server'

import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/sanitize'

export async function submitReview(data: {
  productId: string
  sellerId: string
  rating: number
  comment: string
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to leave a review.' }

  // Rating must be a whole integer 1–5
  const rating = Math.floor(data.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be a whole number between 1 and 5.' }
  }

  const comment = data.comment.trim()
  if (comment.length > 500) return { error: 'Comment must be 500 characters or fewer.' }

  const { error: insertError } = await supabase.from('reviews').insert({
    reviewer_id: user.id,
    product_id: data.productId,
    seller_id: data.sellerId,
    rating,
    comment: comment ? sanitizeText(comment, 500) : null,
  })

  if (insertError) return { error: 'Failed to submit review. Please try again.' }

  return { success: true }
}
