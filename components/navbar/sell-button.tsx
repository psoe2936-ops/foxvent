import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type SellButtonProps = {
  isLoggedIn?: boolean
  onRequireAuth?: () => void
  className?: string
}

export function SellButton({
  isLoggedIn = false,
  onRequireAuth,
  className,
}: SellButtonProps) {
  const handleClick = () => {
    if (!isLoggedIn) {
      onRequireAuth?.()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#F36D21] px-3 text-sm font-medium text-white transition-colors hover:bg-[#E0631D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/50 focus-visible:ring-offset-2',
        className
      )}
    >
      <Plus className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Sell</span>
    </button>
  )
}
