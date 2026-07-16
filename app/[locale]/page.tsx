import { redirect } from 'next/navigation'

type SearchParams = Promise<{
  category?: string
  q?: string
  sort?: string
  login?: string
  next?: string
}>

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const sp = new URLSearchParams()
  if (params.login === '1') {
    sp.set('login', '1')
    if (params.next) sp.set('next', params.next)
  } else {
    if (params.category) sp.set('category', params.category)
    if (params.q) sp.set('q', params.q)
    if (params.sort) sp.set('sort', params.sort)
  }

  redirect(sp.toString() ? `/feed?${sp.toString()}` : '/feed')
}
