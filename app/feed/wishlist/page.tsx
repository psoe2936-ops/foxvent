import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WishlistContent } from '@/components/wishlist/wishlist-content'

export default async function FeedWishlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1&next=/feed/wishlist')

  return <WishlistContent userId={user.id} />
}
