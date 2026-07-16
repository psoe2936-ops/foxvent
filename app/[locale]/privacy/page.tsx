import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-[#1F2937]">Privacy Policy</h1>
      <p className="mt-4 text-base leading-relaxed text-[#6B7280]">
        FoxVent collects only the information needed to provide our service. We
        do not sell your personal data to third parties.
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
