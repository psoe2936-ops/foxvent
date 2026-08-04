'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, formatRetryTime } from '@/lib/rate-limit'
import { sanitizeText } from '@/lib/sanitize'

const ALLOWED_CONDITIONS = new Set(['new', 'like_new', 'good', 'fair'])

type ListingFields = {
  categoryId: string
  title: string
  description: string | null
  price: number
  condition: string
  location: string | null
  images: string[]
}

type CreateListingResult =
  | { error: string }
  | { id: string; title: string; price: number; images: string[] | null; status: string; is_sold: boolean | null }

export async function createListing(data: ListingFields): Promise<CreateListingResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to create a listing.' }

  // ── Field validation ──────────────────────────────────────────────────────
  const title = data.title.trim()
  if (!title || title.length < 3) return { error: 'Title must be at least 3 characters.' }
  if (title.length > 100) return { error: 'Title must be 100 characters or fewer.' }

  const description = (data.description ?? '').trim()
  if (!description || description.length < 10) return { error: 'Description must be at least 10 characters.' }
  if (description.length > 2000) return { error: 'Description must be 2000 characters or fewer.' }

  if (!data.categoryId) return { error: 'Please select a category.' }
  const { data: catRow } = await supabase
    .from('categories')
    .select('id')
    .eq('id', data.categoryId)
    .single()
  if (!catRow) return { error: 'Selected category is invalid.' }

  if (!ALLOWED_CONDITIONS.has(data.condition)) {
    return { error: 'Condition must be one of: new, like new, good, or fair.' }
  }

  const price = Number(data.price)
  if (!Number.isFinite(price) || price <= 0) return { error: 'Price must be a positive number.' }
  if (price > 999_999_999) return { error: 'Price exceeds the maximum allowed value.' }

  if (!data.images || data.images.length === 0) return { error: 'At least one photo is required.' }
  if (data.images.length > 8) return { error: 'You can upload at most 8 photos.' }

  const location = (data.location ?? '').trim()
  if (location.length > 100) return { error: 'Location must be 100 characters or fewer.' }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await checkRateLimit(supabase, user.id, 'create_listing', 10, 60)
  if (!rl.allowed) {
    const wait = formatRetryTime(rl.retryAfterSeconds ?? 3600)
    return { error: `You're creating listings a bit fast — give it ${wait} and try again!` }
  }

  const { data: newProduct, error } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      category_id: data.categoryId,
      title: sanitizeText(title, 100),
      description: sanitizeText(description, 2000),
      price,
      condition: data.condition,
      location: location ? sanitizeText(location, 100) : null,
      images: data.images,
    })
    .select('id, title, price, images, status, is_sold')
    .single()

  if (error) return { error: 'Failed to create listing. Please try again.' }
  return newProduct!
}

async function verifySeller(productId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: product } = await supabase
    .from('products')
    .select('id, seller_id, status')
    .eq('id', productId)
    .single()

  if (!product) throw new Error('Product not found')
  if (product.seller_id !== user.id) throw new Error('Not authorized')

  return { supabase, product }
}

export async function updateProduct(formData: FormData): Promise<{ error: string } | undefined> {
  const productId = formData.get('productId') as string
  const sellerUsername = (formData.get('sellerUsername') as string) || ''

  // ── Field validation ──────────────────────────────────────────────────────
  const title = (formData.get('title') as string)?.trim()
  if (!title || title.length < 3) return { error: 'Title must be at least 3 characters.' }
  if (title.length > 100) return { error: 'Title must be 100 characters or fewer.' }

  const description = (formData.get('description') as string)?.trim() || null
  if (description && description.length > 2000) return { error: 'Description must be 2000 characters or fewer.' }

  const priceRaw = formData.get('price') as string
  const price = Number(priceRaw)
  if (!Number.isFinite(price) || price <= 0) return { error: 'Price must be a positive number.' }
  if (price > 999_999_999) return { error: 'Price exceeds the maximum allowed value.' }

  const condition = formData.get('condition') as string
  if (!ALLOWED_CONDITIONS.has(condition)) return { error: 'Condition must be one of: new, like new, good, or fair.' }

  const categoryId = formData.get('category_id') as string
  if (!categoryId) return { error: 'Please select a category.' }

  const location = (formData.get('location') as string)?.trim() || null
  if (location && location.length > 100) return { error: 'Location must be 100 characters or fewer.' }

  const { supabase, product } = await verifySeller(productId)

  // Verify category exists
  const { data: catRow } = await supabase
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .single()
  if (!catRow) return { error: 'Selected category is invalid.' }

  // Editing a rejected or approved listing resubmits it for review
  const newStatus =
    product.status === 'rejected' || product.status === 'approved'
      ? 'pending'
      : product.status

  const { error } = await supabase
    .from('products')
    .update({
      title: sanitizeText(title, 100),
      description: description ? sanitizeText(description, 2000) : null,
      price,
      condition,
      category_id: categoryId,
      location: location ? sanitizeText(location, 100) : null,
      status: newStatus,
    })
    .eq('id', productId)

  if (error) return { error: 'Failed to update listing. Please try again.' }

  revalidatePath(`/products/${productId}`)
  if (sellerUsername) revalidatePath(`/profile/${sellerUsername}`)
}

export async function deleteProduct(productId: string, sellerUsername: string) {
  const { supabase } = await verifySeller(productId)

  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw new Error('Failed to delete listing. Please try again.')

  revalidatePath(`/profile/${sellerUsername}`)
  redirect(`/profile/${sellerUsername}`)
}

export async function markAsSold(productId: string) {
  const { supabase, product } = await verifySeller(productId)

  if (product.status !== 'approved') throw new Error('Only approved listings can be marked as sold.')

  const { error } = await supabase
    .from('products')
    .update({ is_sold: true })
    .eq('id', productId)

  if (error) throw new Error('Failed to update listing. Please try again.')

  revalidatePath(`/products/${productId}`)
}

export async function markAsUnsold(productId: string) {
  const { supabase, product } = await verifySeller(productId)

  if (product.status !== 'approved') throw new Error('Only approved listings can be marked as available.')

  const { error } = await supabase
    .from('products')
    .update({ is_sold: false })
    .eq('id', productId)

  if (error) throw new Error('Failed to update listing. Please try again.')

  revalidatePath(`/products/${productId}`)
}
