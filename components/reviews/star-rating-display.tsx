import { Star } from 'lucide-react'

const SIZE_CLASS = { sm: 'size-4', md: 'size-5', lg: 'size-6' }

export function StarRatingDisplay({
  rating,
  size = 'md',
  showNumber = false,
}: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
}) {
  // Round to nearest 0.5 for half-star display
  const rounded = Math.round(rating * 2) / 2
  const fullStars = Math.floor(rounded)
  const hasHalf = rounded % 1 !== 0
  const starClass = SIZE_CLASS[size]

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((pos) => {
          const isFull = pos <= fullStars
          const isHalf = !isFull && pos === fullStars + 1 && hasHalf

          if (isHalf) {
            return (
              <span key={pos} className="relative inline-block">
                <Star className={`${starClass} fill-[#E5E7EB] text-[#E5E7EB]`} />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: '50%' }}
                >
                  <Star className={`${starClass} fill-[#F36D21] text-[#F36D21]`} />
                </span>
              </span>
            )
          }

          return (
            <Star
              key={pos}
              className={`${starClass} ${
                isFull
                  ? 'fill-[#F36D21] text-[#F36D21]'
                  : 'fill-none text-[#E5E7EB]'
              }`}
            />
          )
        })}
      </div>
      {showNumber && (
        <span className="text-sm text-[#6B7280]">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}
