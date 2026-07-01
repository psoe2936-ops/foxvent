import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1F2937]">About FoxVent</h1>
      <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
        FoxVent is a trusted C2C marketplace where buyers and sellers connect
        directly. Every listing is reviewed by our team before going live.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-[#F36D21] hover:underline"
      >
        ← Back to browse
      </Link>
    </main>
  )
}
