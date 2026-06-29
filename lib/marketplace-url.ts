export function buildMarketplaceHref(
  params: { category?: string; q?: string; sort?: string },
  overrides?: Partial<{ category?: string; q?: string; sort?: string }>,
  base = '/'
) {
  const merged = { ...params, ...overrides }
  const sp = new URLSearchParams()
  if (merged.category) sp.set('category', merged.category)
  if (merged.q) sp.set('q', merged.q)
  const sort = merged.sort ?? 'newest'
  if (sort !== 'newest') sp.set('sort', sort)
  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}
