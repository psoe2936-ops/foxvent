'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'foxvent_recent_searches'
const MAX_RECENT = 3

type Category = { id: string; name: string; icon: string | null }

type SearchBarProps = {
  className?: string
  categories?: Category[]
}

export function SearchBar({ className, categories = [] }: SearchBarProps) {
  const [value, setValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecentSearches(JSON.parse(stored) as string[])
    } catch {}
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function saveRecentSearch(q: string) {
    try {
      const next = [q, ...recentSearches.filter((s) => s !== q)].slice(0, MAX_RECENT)
      setRecentSearches(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  function navigate(q: string) {
    setShowDropdown(false)
    inputRef.current?.blur()
    const trimmed = q.trim()
    if (trimmed) {
      saveRecentSearch(trimmed)
      router.push(`/feed?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/feed')
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    navigate(value)
  }

  function handleClear() {
    setValue('')
    router.push('/feed')
    inputRef.current?.focus()
  }

  function handleFocus() {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setShowDropdown(true)
  }

  function handleBlur() {
    blurTimerRef.current = setTimeout(() => setShowDropdown(false), 150)
  }

  const showDropdownContent =
    showDropdown && !value && (recentSearches.length > 0 || categories.length > 0)

  return (
    <div className={cn('relative w-full max-w-2xl', className)}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="navbar-search" className="sr-only">
          Search products, categories or users
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-[#9CA3AF]"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="navbar-search"
          name="q"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search products, categories or users..."
          className={`h-10 w-full rounded-xl border border-transparent bg-[#F3F4F6] pl-10 text-sm text-[#2D2E32] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#E5E7EB] focus:bg-white focus:ring-2 focus:ring-[#F36D21]/20 ${value ? 'pr-9' : 'pr-16'}`}
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-[#E5E7EB] bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#9CA3AF] sm:inline-flex">
            <span>Ctrl</span>
            <span>/</span>
          </kbd>
        )}
      </form>

      {showDropdownContent && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
          {recentSearches.length > 0 && (
            <div className={categories.length > 0 ? 'mb-3' : ''}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setValue(s)
                      navigate(s)
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] px-3 py-1 text-xs text-[#374151] hover:bg-[#F3F4F6]"
                  >
                    <Search className="size-3 text-[#9CA3AF]" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setShowDropdown(false)
                      router.push(`/feed?category=${cat.id}`)
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] px-3 py-1 text-xs text-[#374151] hover:bg-[#F9FAFB]"
                  >
                    {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
