import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavbarServer } from '@/components/navbar/navbar-server'
import { FollowingContent } from '@/components/following/following-content'

export default async function FollowingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?login=1&next=/following')
  }

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <FollowingContent userId={user.id} />
      </main>
    </>
  )
}
