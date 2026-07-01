import { cn } from '@/lib/utils'

type AuthPreviewToggleProps = {
  isLoggedIn: boolean
  onToggle: () => void
}

export function AuthPreviewToggle({
  isLoggedIn,
  onToggle,
}: AuthPreviewToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'fixed right-4 bottom-4 z-50 rounded-full px-4 py-2.5 text-xs font-semibold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/50',
        isLoggedIn
          ? 'bg-[#F36D21] text-white hover:bg-[#E0631D]'
          : 'bg-[#2D2E32] text-white hover:bg-[#1F2023]'
      )}
    >
      Preview: {isLoggedIn ? 'Logged In' : 'Guest'} — tap to switch
    </button>
  )
}
