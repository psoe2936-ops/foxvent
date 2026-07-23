'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { WishlistHeart } from '@/components/feed/wishlist-heart'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { StarRatingDisplay } from '@/components/reviews/star-rating-display'

type ProductCardProps = {
  id: string
  title: string
  price: number
  images: string[] | null
  conditionLabel: string
  conditionKey: string
  categoryName?: string
  sellerUsername?: string
  sellerAvatar?: string | null
  createdAt: string
  initialSaved?: boolean
  isFollowingSeller?: boolean
  isSold?: boolean
  sellerRating?: number | null
  sellerReviewCount?: number
}

const CONDITION_STYLES: Record<string, string> = {
  new: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  like_new: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  good: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  fair: 'bg-orange-50 text-orange-700 ring-orange-600/20',
}

export function ProductCard({
  id,
  title,
  price,
  images,
  conditionLabel,
  conditionKey,
  categoryName,
  sellerUsername,
  sellerAvatar,
  createdAt,
  initialSaved = false,
  isFollowingSeller = false,
  isSold = false,
  sellerRating = null,
  sellerReviewCount = 0,
}: ProductCardProps) {
  const t = useTranslations('product')

  const badgeStyle =
    CONDITION_STYLES[conditionKey] ??
    'bg-gray-50 text-gray-600 ring-gray-500/20'

  return (
    <Link
      href={`/products/${id}`}
      className="group block overflow-hidden rounded-xl border border-[#E8EAED] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all hover:border-[#F36D21]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
    >
      <div className="relative aspect-5/4 w-full overflow-hidden bg-[#F3F4F6]">
        {images && images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[0]}
            alt={title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-[#9CA3AF]">
            No image
          </div>
        )}
        <span
          className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${badgeStyle}`}
        >
          {conditionLabel}
        </span>
        {isSold && (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {t('sold')}
          </span>
        )}
        <WishlistHeart productId={id} initialSaved={initialSaved} />
      </div>

      <div className="p-3 sm:p-4">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#1F2937]">
          {title}
        </p>
        <p className="mt-1.5 text-xl font-bold text-[#F36D21]">
          MMK {price.toLocaleString()}
        </p>

        {(categoryName || conditionLabel) && (
          <p className="mt-1 text-xs text-[#9CA3AF]">
            {[conditionLabel, categoryName].filter(Boolean).join(' · ')}
          </p>
        )}

        <p className="mt-0.5 text-xs text-[#9CA3AF]">
          {formatRelativeTime(createdAt)}
        </p>

        {sellerUsername && (
          <div className="mt-3 flex items-center gap-2.5 border-t border-[#F3F4F6] pt-3">
            {sellerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sellerAvatar}
                alt=""
                className="size-6 rounded-full bg-[#F3F4F6] object-cover ring-1 ring-[#E5E7EB]"
              />
            ) : (
              <div className="size-6 rounded-full bg-[#E5E7EB] ring-1 ring-[#E5E7EB]" />
            )}
            <span className="min-w-0 truncate text-xs font-medium text-[#4B5563]">
              @{sellerUsername}
            </span>
            {sellerRating !== null && sellerReviewCount > 0 ? (<span className="ml-auto shrink-0">
                <StarRatingDisplay rating={sellerRating} size="sm" showNumber />
              </span>
            ) : isFollowingSeller ? (
              <span className="ml-auto shrink-0 rounded-full bg-[#FEF3E2] px-1.5 py-0.5 text-[10px] font-medium text-[#F36D21]">
                {t('following') ?? 'Following'}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  )
}