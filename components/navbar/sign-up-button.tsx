import { cn } from '@/lib/utils'

type SignUpButtonProps = {
  onClick?: () => void
  className?: string
}

export function SignUpButton({ onClick, className }: SignUpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bg-white text-[#F36D21] border-2 border-[#F36D21] rounded-lg px-3 py-1 text-base font-medium transition-all duration-200 ease-in-out hover:bg-[#FEF3E2]',
        className
      )}
    >
      Sign Up
    </button>
  )
}
