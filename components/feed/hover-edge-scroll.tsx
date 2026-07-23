'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HoverEdgeScrollProps = {
  children: ReactNode
  className?: string
  edgeSize?: number
  maxSpeed?: number
}

export function HoverEdgeScroll({
  children,
  className,
  edgeSize = 72,
  maxSpeed = 10,
}: HoverEdgeScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const directionRef = useRef(0)
  const speedRef = useRef(0)
  const frameRef = useRef<number>(0)

  const tick = useCallback(() => {
    const el = containerRef.current
    if (el && directionRef.current !== 0) {
      el.scrollLeft += directionRef.current * speedRef.current
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [tick])

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = event.clientX - rect.left
    const zone = Math.min(edgeSize, rect.width * 0.18)
    const maxScroll = el.scrollWidth - el.clientWidth

    if (x < zone && el.scrollLeft > 0) {
      directionRef.current = -1
      speedRef.current = ((zone - x) / zone) * maxSpeed
      return
    }

    if (x > rect.width - zone && el.scrollLeft < maxScroll - 1) {
      directionRef.current = 1
      speedRef.current = ((x - (rect.width - zone)) / zone) * maxSpeed
      return
    }

    directionRef.current = 0
    speedRef.current = 0
  }

  function handleMouseLeave() {
    directionRef.current = 0
    speedRef.current = 0
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const el = containerRef.current
    if (!el) return

    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault()
      el.scrollLeft += event.deltaY
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      className={cn('scrollbar-none overflow-x-auto', className)}
    >
      {children}
    </div>
  )
}
