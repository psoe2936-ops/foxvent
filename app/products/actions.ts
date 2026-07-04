'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

export async function updateProduct(formData: FormData) {
  const productId = formData.get('productId') as string
  const sellerUsername = (formData.get('sellerUsername') as string) || ''

  const { supabase, product } = await verifySeller(productId)

  // Editing a rejected or approved listing resubmits it for review
  const newStatus =
    product.status === 'rejected' || product.status === 'approved'
      ? 'pending'
      : product.status

  const { error } = await supabase
    .from('products')
    .update({
      title: (formData.get('title') as string).trim(),
      description: (formData.get('description') as string)?.trim() || null,
      price: Number(formData.get('price')),
      condition: formData.get('condition') as string,
      category_id: formData.get('category_id') as string,
      location: (formData.get('location') as string)?.trim() || null,
      status: newStatus,
    })
    .eq('id', productId)

  if (error) throw new Error('Failed to update listing. Please try again.')

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
