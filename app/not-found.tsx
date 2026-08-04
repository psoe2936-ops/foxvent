import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F9FAFB] p-6 text-center">
      <div className="text-6xl">🦊</div>
      <h1 className="text-2xl font-bold text-[#1F2937]">Page not found</h1>
      <p className="max-w-sm text-sm text-[#6B7280]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/feed"
        className="rounded-lg bg-[#F36D21] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        Go to homepage
      </Link>
    </div>
  )
}
