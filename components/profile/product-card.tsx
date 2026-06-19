import Link from 'next/link'

export type Product = {
  id: string
  title: string
  price: number
  images: string[] | null
  status: string
  is_sold: boolean
}

type ProductCardProps = {
  product: Product
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-[#FEF3E2] text-[#C26A08]' },
  approved: { label: 'Approved', className: 'bg-[#E7F6EC] text-[#1F9254]' },
  rejected: { label: 'Rejected', className: 'bg-[#FDEDEC] text-[#C0392B]' },
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0]
  const badge = product.is_sold
    ? { label: 'Sold', className: 'bg-[#F3F4F6] text-[#6B7280]' }
    : STATUS_BADGES[product.status] ?? STATUS_BADGES.pending

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F3F4F6]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-[#9CA3AF]">
            No image
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-medium text-[#2D2E32] line-clamp-2">
        {product.title}
      </h3>
      <p className="mt-1 text-base font-semibold text-[#F36D21]">
        {formatPrice(product.price)}
      </p>
    </Link>
  )
}
