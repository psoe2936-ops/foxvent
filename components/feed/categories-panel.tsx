import Link from 'next/link'

type Category = {
  id: string
  name: string
  icon: string | null
}

type CategoriesPanelProps = {
  categories: Category[]
  activeCategory?: string
  searchQuery?: string
}

function categoryHref(
  categoryId: string,
  searchQuery?: string,
  sort?: string
) {
  const params = new URLSearchParams()
  params.set('category', categoryId)
  if (searchQuery) params.set('q', searchQuery)
  if (sort && sort !== 'newest') params.set('sort', sort)
  return `/?${params.toString()}`
}

export function CategoriesPanel({
  categories,
  activeCategory,
  searchQuery,
  sort,
}: CategoriesPanelProps & { sort?: string }) {
  return (
    <section className="rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-[#2D2E32]">Categories</h2>

      <ul className="mt-3 space-y-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <li key={cat.id}>
              <Link
                href={categoryHref(cat.id, searchQuery, sort)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#FEF3E2] font-medium text-[#F36D21]'
                    : 'text-[#2D2E32] hover:bg-[#F9FAFB]'
                }`}
              >
                <span className="text-base" aria-hidden>
                  {cat.icon}
                </span>
                <span className="truncate">{cat.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
