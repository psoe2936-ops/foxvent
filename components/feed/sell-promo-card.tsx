import Link from 'next/link'
import { FoxIcon } from '@/components/navbar/fox-icon'

export function SellPromoCard() {
  return (
    <section className="rounded-xl border border-[#E8EAED] bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center px-2 py-2 text-center">
        <FoxIcon className="size-10" />
        <p className="mt-3 text-sm font-semibold text-[#1F2937]">
          List in minutes
        </p>
        <p className="mt-1.5 text-xs text-[#9CA3AF]">
          Sell to your community.
        </p>
        <Link
          href="/feed"
          className="mt-4 w-full rounded-lg bg-[#F36D21] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start Selling
        </Link>
      </div>
    </section>
  )
}
