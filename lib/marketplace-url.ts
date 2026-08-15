export type MarketplaceFilterParams = {
  category?: string
  q?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  condition?: string
  hideSold?: string
}

export function buildMarketplaceHref(
  params: MarketplaceFilterParams,
  overrides?: Partial<MarketplaceFilterParams>,
  base = '/'
) {
  const merged = { ...params, ...overrides }
  const sp = new URLSearchParams()
  if (merged.category) sp.set('category', merged.category)
  if (merged.q) sp.set('q', merged.q)
  const sort = merged.sort ?? 'newest'
  if (sort !== 'newest') sp.set('sort', sort)
  if (merged.minPrice) sp.set('minPrice', merged.minPrice)
  if (merged.maxPrice) sp.set('maxPrice', merged.maxPrice)
  if (merged.condition) sp.set('condition', merged.condition)
  if (merged.hideSold) sp.set('hideSold', merged.hideSold)
  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
}
