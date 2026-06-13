'use client'

import { Search } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  className?: string
}

export function SearchBar({ className }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('relative w-full max-w-2xl', className)}>
      <label htmlFor="navbar-search" className="sr-only">
        Search products, categories or users
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9CA3AF]"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id="navbar-search"
        type="search"
        placeholder="Search products, categories or users..."
        className="h-10 w-full rounded-xl border border-transparent bg-[#F3F4F6] pr-16 pl-10 text-sm text-[#2D2E32] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#E5E7EB] focus:bg-white focus:ring-2 focus:ring-[#F36D21]/20"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#9CA3AF] sm:inline-flex">
        <span>Ctrl</span>
        <span>/</span>
      </kbd>
    </div>
  )
}
