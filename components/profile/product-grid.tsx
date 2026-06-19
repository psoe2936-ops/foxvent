import { ProductCard, type Product } from '@/components/profile/product-card'

type ProductGridProps = {
  products: Product[]
  isOwner: boolean
}

export function ProductGrid({ products, isOwner }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-10 text-center">
        <p className="text-sm font-medium text-[#2D2E32]">No listings yet</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          {isOwner
            ? 'Items you list for sale will show up here.'
            : 'This user has not listed anything yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
