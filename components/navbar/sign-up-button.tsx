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
        className="bg-white text-[#f16522] border-2 border-[#f16522] rounded-lg px-3 py-1 text-base font-[500] transition-all duration-200 ease-in-out hover:bg-[#fdf3ed]",
        
      )}
    >
      Sign Up
    </button>
  )
}
