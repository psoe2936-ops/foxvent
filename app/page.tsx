import { Navbar } from '@/components/navbar/navbar'

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#2D2E32]">
            FoxVent
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#6B7280]">
            Navbar preview — use the floating button (bottom-right) to toggle
            between Guest and Logged In UI states.
          </p>
        </div>
      </main>
    </>
  )
}
