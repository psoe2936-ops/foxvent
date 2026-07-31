'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from '@/lib/audit-log'

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

  if (!profile || profile.role !== 'admin') {
    throw new Error('Not authorized')
  }

  return { supabase, user }
}

export async function approveProduct(
  productId: string
): Promise<{ error: string } | { success: true }> {
  const { supabase, user } = await verifyAdmin()

  const { error, count } = await supabase
    .from('products')
    .update(
      { status: 'approved', approved_at: new Date().toISOString() },
      { count: 'exact' }
    )
    .eq('id', productId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Approve failed — no rows affected. Check permissions.' }

  await logAdminAction(supabase, user.id, 'approve_product', 'product', productId)

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

export async function rejectProduct(
  productId: string,
  reason: string
): Promise<{ error: string } | { success: true }> {
  const { supabase, user } = await verifyAdmin()

  // Fetch product + seller for the notification
  const { data: product } = await supabase
    .from('products')
    .select('title, seller_id, users(username)')
    .eq('id', productId)
    .single()

  const { error, count } = await supabase
    .from('products')
    .update({ status: 'rejected', rejection_reason: reason }, { count: 'exact' })
    .eq('id', productId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Reject failed — no rows affected. Check permissions.' }

  // Insert notification with rejection reason included in body
  if (product) {
    const seller = Array.isArray(product.users) ? product.users[0] : product.users
    await supabase.from('notifications').insert({
      user_id: product.seller_id,
      type: 'product_rejected',
      title: 'Your listing needs changes',
      body: `Your listing "${product.title}" was rejected. Reason: ${reason}`,
      link: `/profile/${seller?.username}`,
    })
  }

  await logAdminAction(supabase, user.id, 'reject_product', 'product', productId, {
    reason,
    title: product?.title ?? null,
  })

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

export async function deleteProductAsAdmin(
  productId: string
): Promise<{ error: string } | { success: true }> {
  const { supabase, user } = await verifyAdmin()

  // Fetch title before deletion so the audit log retains it
  const { data: product } = await supabase
    .from('products')
    .select('title')
    .eq('id', productId)
    .single()

  const { error, count } = await supabase
    .from('products')
    .delete({ count: 'exact' })
    .eq('id', productId)

  if (error) return { error: error.message }
  if (!count) return { error: 'Delete failed — no rows affected. Check permissions.' }

  await logAdminAction(supabase, user.id, 'delete_product', 'product', productId, {
    title: product?.title ?? null,
  })

  revalidatePath('/admin/products')
  return { success: true }
}
