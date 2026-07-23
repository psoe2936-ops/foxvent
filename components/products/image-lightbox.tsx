'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  images: string[]
  alt: string
  initialIndex?: number
  onClose: () => void
}

export function ImageLightbox({ images, alt, initialIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex)
  const hasMany = images.length > 1

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrent((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setCurrent((i) => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <X className="size-5" />
      </button>

      {/* Counter */}
      {hasMany && (
        <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 text-xs font-medium text-white/70">
          {current + 1} / {images.length}
        </p>
      )}

      {/* Main image area */}
      <div
        className="flex flex-1 items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {hasMany && (
          <button
            type="button"
            onClick={() => setCurrent((i) => Math.max(0, i - 1))}
            disabled={current === 0}
            aria-label="Previous image"
            className="absolute left-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 sm:left-6"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current]}
          alt={`${alt} — photo ${current + 1}`}
          className="max-h-[80vh] max-w-full select-none rounded-lg object-contain"
          draggable={false}
        />

        {hasMany && (
          <button
            type="button"
            onClick={() => setCurrent((i) => Math.min(images.length - 1, i + 1))}
            disabled={current === images.length - 1}
            aria-label="Next image"
            className="absolute right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 sm:right-6"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMany && (
        <div
          className="flex shrink-0 items-center justify-center gap-2 px-4 pb-5"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Photo ${i + 1}`}
              className={`size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === current
                  ? 'border-[#F36D21] opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
