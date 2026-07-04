'use client'

import { useState } from 'react'
import { ImageLightbox } from '@/components/products/image-lightbox'

type Props = {
  images: string[]
  title: string
  isSold: boolean
}

export function ImageGallery({ images, title, isSold }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
        {images.length > 0 ? (
          images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-square w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]"
              aria-label={`View photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${title} photo ${i + 1}`}
                className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          ))
        ) : (
          <div className="col-span-2 flex aspect-video items-center justify-center rounded-xl bg-[#F3F4F6] text-sm text-[#9CA3AF]">
            No images
          </div>
        )}
      </div>

      {isSold && (
        <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          Sold
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          alt={title}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
