import Image from 'next/image'
import { cn } from '@/lib/utils'

type FoxIconProps = {
  className?: string
}

export function FoxIcon({ className }: FoxIconProps) {
  return (
    <Image
      src="/fox-curious.png"
      alt="FoxVend"
      width={80}
      height={80}
      className={cn('size-17 shrink-0 rounded-full object-cover', className)}
    />
  )
}
