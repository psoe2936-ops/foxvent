'use client'

import { useRouter } from 'next/navigation'

const CATEGORY_TILES = [
  { name: 'Electronics', icon: '💻' },
  { name: 'Mobiles', icon: '📱' },
  { name: 'Fashion', icon: '👕' },
  { name: 'Books', icon: '📚' },
  { name: 'Home', icon: '🏠' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Furniture', icon: '🪑' },
  { name: 'Other', icon: '📦' },
]

export function CategoryTiles({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter()

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {CATEGORY_TILES.map((cat) => (
        <button
          key={cat.name}
          onClick={() => router.push(isLoggedIn ? '/' : '/?login=1')}
          className="flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center hover:border-[#F36D21]"
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-xs font-medium text-[#2D2E32]">{cat.name}</span>
        </button>
      ))}
    </div>
  )
}