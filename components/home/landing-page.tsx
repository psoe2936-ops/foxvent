import { BrowseCtaButton } from '@/components/home/browse-cta-button'
import { CategoryTiles } from '@/components/home/category-tiles'
import { FoxIcon } from '@/components/navbar/fox-icon'

export function LandingPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-2xl bg-[#2D2E32]">
        <div className="grid grid-cols-1 items-center gap-8 px-8 py-14 sm:px-12 lg:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Buy and sell verified items in your community
            </h1>
            <p className="mt-4 text-base text-[#D1D5DB]">
              Every listing reviewed by our team before going live. Chat
              directly with sellers. No surprises.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BrowseCtaButton isLoggedIn={isLoggedIn} />
              {!isLoggedIn && (
                <BrowseCtaButton isLoggedIn={false} label="Start selling" />
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white/5 p-8 text-center">
              <FoxIcon className="mx-auto size-16" />
              <p className="mt-3 text-sm text-[#D1D5DB]">
                Every item verified before you see it
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
          Browse by category
        </h2>
        <CategoryTiles isLoggedIn={isLoggedIn} />
      </div>
    </main>
  )
}
