import type { Metadata } from 'next'
import { FeedProductGrid } from '@/components/feed/feed-product-grid'

export const metadata: Metadata = {
  title: 'Browse Listings',
  description: 'Discover pre-loved items for sale on FoxVent — electronics, fashion, furniture and more.',
}

type SearchParams = Promise<{
  category?: string
  q?: string
  sort?: string
}>

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  return <FeedProductGrid searchParams={params} basePath="/feed" />
}
