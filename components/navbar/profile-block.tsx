import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProfileBlockProps = {
  name?: string
  avatarUrl?: string
  className?: string
}

export function ProfileBlock({
  name = 'Alex Verma',
  avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
  className,
}: ProfileBlockProps) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-label={`${name} profile menu`}
      className={cn(
        'flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36D21]/30',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
      <span className="hidden min-w-0 flex-col items-start text-left md:flex">
        <span className="truncate text-sm font-semibold text-[#2D2E32]">
          {name}
        </span>
        <span className="text-xs text-[#9CA3AF]">View profile</span>
      </span>
      <ChevronDown
        className="hidden size-4 shrink-0 text-[#9CA3AF] md:block"
        aria-hidden="true"
      />
    </button>
  )
}
