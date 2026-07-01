import { Heart } from 'lucide-react'
import { formatPrice, type ProfileListing } from '@/lib/mock/profile'

type ProfileListingCardProps = {
  listing: ProfileListing
}

export function ProfileListingCard({ listing }: ProfileListingCardProps) {
  return (
    <article className="group">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F3F4F6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label={`Save ${listing.title}`}
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-[#6B7280] shadow-sm transition-colors hover:text-[#F36D21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30"
        >
          <Heart className="size-4" aria-hidden="true" />
        </button>
      </div>
      <h3 className="mt-3 text-sm font-medium text-[#2D2E32] line-clamp-2">
        {listing.title}
      </h3>
      <p className="mt-1 text-base font-semibold text-[#F36D21]">
        {formatPrice(listing.price)}
      </p>
    </article>
  )
}
