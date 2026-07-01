import Link from 'next/link'
import { FoxIcon } from '@/components/navbar/fox-icon'

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <FoxIcon />
      <span className="text-[1.35rem] font-bold tracking-tight">
        <span className="text-[#F36D21]">Fox</span>
        <span className="text-[#2D2E32]">Vend</span>
      </span>
    </Link>
  )
}
