'use client'

import { useRouter } from 'next/navigation'

export function BrowseCtaButton({
  isLoggedIn,
  label = 'Browse listings',
}: {
  isLoggedIn: boolean
  label?: string
}) {
  const router = useRouter()

  const handleClick = () => {
    if (isLoggedIn) {
      router.push('/')
    } else {
      router.push('/?login=1')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg bg-[#F36D21] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
    >
      {label}
    </button>
  )
}