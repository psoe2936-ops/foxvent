import Link from 'next/link'
import { FoxIcon } from '@/components/navbar/fox-icon'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  iconClassName?: string
  textClassName?: string
}

export function Logo({ className, iconClassName, textClassName }: LogoProps) {
  return (
    <Link href="/" className={cn('flex shrink-0 items-center gap-2', className)}>
      <FoxIcon className={iconClassName} />
      <span className={cn('text-[1.35rem] font-bold tracking-tight', textClassName)}>
        <span className="text-[#F36D21]">Fox</span>
        <span className="text-[#2D2E32]">Vend</span>
      </span>
    </Link>
  )
}
