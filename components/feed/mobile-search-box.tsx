'use client'

import { Link } from '@/i18n/navigation'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type MobileSearchBoxProps = {
  basePath: string
  category?: string
  sort: string
  minPrice?: string
  maxPrice?: string
  condition?: string
  hideSold?: string
  q?: string
  clearSearchUrl: string
}

export function MobileSearchBox({
  basePath,
  category,
  sort,
  minPrice,
  maxPrice,
  condition,
  hideSold,
  q,
  clearSearchUrl,
}: MobileSearchBoxProps) {
  const t = useTranslations('feed')
  const tNavbar = useTranslations('navbar')
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  useEffect(() => {
    function onOpenSearch() { setShowMobileSearch(true) }
    window.addEventListener('foxvent-open-search', onOpenSearch)
    return () => window.removeEventListener('foxvent-open-search', onOpenSearch)
  }, [])

  if (!showMobileSearch) return null

  return (
    <div className="relative w-full sm:w-56 md:hidden">
      <form action={basePath} method="get">
        {category && <input type="hidden" name="category" value={category} />}
        {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
        {minPrice && <input type="hidden" name="minPrice" value={minPrice} />}
        {maxPrice && <input type="hidden" name="maxPrice" value={maxPrice} />}
        {condition && <input type="hidden" name="condition" value={condition} />}
        {hideSold && <input type="hidden" name="hideSold" value={hideSold} />}
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder={tNavbar('searchPlaceholder')}
          className={`w-full rounded-lg border border-[#E8EAED] bg-white py-2 text-sm text-[#374151] shadow-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#F36D21] focus:ring-1 focus:ring-[#F36D21]/20 ${q ? 'pl-3.5 pr-8' : 'px-3.5'}`}
        />
      </form>
      {q && (
        <Link
          href={clearSearchUrl}
          aria-label={t('clearSearchAriaLabel')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
        >
          <X className="size-3.5" />
        </Link>
      )}
    </div>
  )
}
