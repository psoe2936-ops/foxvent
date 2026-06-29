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
  const { supabase, product } = await verifySeller(productId)

  if (product.status === 'approved') {
    throw new Error('Approved listings cannot be edited')
  }

  await supabase
    .from('products')
    .update({
      title: (formData.get('title') as string).trim(),
      description: (formData.get('description') as string)?.trim() || null,
      price: Number(formData.get('price')),
      condition: formData.get('condition') as string,
      category_id: formData.get('category_id') as string,
      location: (formData.get('location') as string)?.trim() || null,
    })
    .eq('id', productId)

  revalidatePath(`/products/${productId}`)
  revalidatePath('/profile')
}

export async function deleteProduct(productId: string, sellerUsername: string) {
  const { supabase } = await verifySeller(productId)
  await supabase.from('products').delete().eq('id', productId)
  revalidatePath(`/profile/${sellerUsername}`)
  redirect(`/profile/${sellerUsername}`)
}

export async function markAsSold(productId: string) {
  const { supabase } = await verifySeller(productId)
  await supabase.from('products').update({ is_sold: true }).eq('id', productId)
  revalidatePath(`/products/${productId}`)
}

export async function markAsUnsold(productId: string) {
  const { supabase } = await verifySeller(productId)
  await supabase.from('products').update({ is_sold: false }).eq('id', productId)
  revalidatePath(`/products/${productId}`)
}
