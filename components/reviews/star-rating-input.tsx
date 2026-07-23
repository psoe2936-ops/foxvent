'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

const SIZE_CLASS = { sm: 'size-4', lg: 'size-8' }

export function StarRatingInput({
  value,
  onChange,
  size = 'lg',
}: {
  value: number
  onChange: (rating: number) => void
  size?: 'sm' | 'lg'
}) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  const starClass = SIZE_CLASS[size]

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="transition-transform hover:scale-110 focus-visible:outline-none"
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`${starClass} transition-colors ${
              star <= display
                ? 'fill-[#F36D21] text-[#F36D21]'
                : 'fill-none text-[#E5E7EB]'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
