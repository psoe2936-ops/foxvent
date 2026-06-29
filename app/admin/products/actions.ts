'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('verifyAdmin check — user id:', user.id, 'profile:', profile)

  if (!profile || profile.role !== 'admin') {
    throw new Error('Not authorized')
  }

  return supabase
}

export async function approveProduct(formData: FormData) {
  const supabase = await verifyAdmin()
  const productId = formData.get('productId') as string

  const { data, error, count } = await supabase
    .from('products')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', productId)
    .select()

  console.log('Approve result — error:', error, 'updated rows:', data)

  revalidatePath('/admin/products')
}

export async function rejectProduct(productId: string, reason: string) {
  const supabase = await verifyAdmin()

  const { data, error } = await supabase
    .from('products')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', productId)
    .select()

  console.log('Reject result — error:', error, 'updated rows:', data)

  revalidatePath('/admin/products')
}

export async function deleteProductAsAdmin(productId: string) {
  const supabase = await verifyAdmin()
  await supabase.from('products').delete().eq('id', productId)
  revalidatePath('/admin/products')
}