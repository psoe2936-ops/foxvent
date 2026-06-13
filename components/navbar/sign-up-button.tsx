import { cn } from '@/lib/utils'

type SignUpButtonProps = {
  className?: string
}

export function SignUpButton({ className }: SignUpButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 shrink-0 items-center rounded-lg bg-[#2D2E32] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1F2023] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D2E32]/40 focus-visible:ring-offset-2',
        className
      )}
    >
      Sign Up
    </button>
  )
}
