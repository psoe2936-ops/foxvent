import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1F2937]">Terms of Service</h1>
      <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
        By using FoxVent, you agree to list items honestly, not post prohibited
        or fake listings, and treat other users with respect.
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
