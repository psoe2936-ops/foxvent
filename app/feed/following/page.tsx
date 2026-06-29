import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FollowingContent } from '@/components/following/following-content'

export default async function FeedFollowingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?login=1&next=/feed/following')
  }

  return <FollowingContent userId={user.id} />
}
