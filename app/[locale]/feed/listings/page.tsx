import { redirect } from 'next/navigation'
import { Store } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ListingsSection } from '@/components/profile/listings-section'

export default async function FeedListingsPage() {
  const t = await getTranslations('sidebar')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/?login=1&next=/feed/listings')

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, price, images, status, is_sold')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, icon').order('name'),
  ])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Store className="size-5 text-[#F36D21]" strokeWidth={1.75} />
        <h1 className="text-xl font-bold text-[#1F2937]">{t('myListings')}</h1>
      </div>
      <ListingsSection
        userId={user.id}
        categories={categoriesResult.data ?? []}
        initialProducts={productsResult.data ?? []}
        isOwner={true}
      />
    </div>
  )
}
