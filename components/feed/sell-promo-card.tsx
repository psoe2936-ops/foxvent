import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { FoxIcon } from '@/components/navbar/fox-icon'

export async function SellPromoCard() {
  const supabase = await createClient()
  const t = await getTranslations('feed')
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let href = '/?login=1'
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()
    href = profile?.username
      ? `/profile/${profile.username}?new=1`
      : '/feed/listings'
  }

  return (
    <section className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div className="flex flex-col items-center px-2 py-2 text-center">
        <FoxIcon className="size-10" />
        <p className="mt-3 text-sm font-semibold text-[#1F2937]">
          {t('listInMinutes')}
        </p>
        <p className="mt-1.5 text-xs text-[#9CA3AF]">
          {t('sellToCommunity')}
        </p>
        <Link
          href={href}
          className="mt-4 w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t('startSelling') ?? 'Start Selling'}
        </Link>
      </div>
    </section>
  )
}