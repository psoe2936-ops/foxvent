import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WishlistContent } from '@/components/wishlist/wishlist-content'

export default async function WishlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1')

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <WishlistContent userId={user.id} />
    </main>
  )
}
