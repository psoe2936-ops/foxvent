import { FeedProductGrid } from '@/components/feed/feed-product-grid'

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
