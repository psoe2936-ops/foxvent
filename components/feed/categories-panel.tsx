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
    <section className="glass-card rounded-3xl p-4">
      <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Categories</h2>

      <ul className="mt-3 space-y-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <li key={cat.id}>
              <Link
                href={categoryHref(cat.id, searchQuery, sort)}
                className={`apple-press flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-orange-500/10 font-medium text-[var(--apple-orange)]'
                    : 'text-slate-950 hover:bg-white/55 dark:text-white dark:hover:bg-white/10'
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
