import Link from 'next/link'

type AuthCodeErrorPageProps = {
  searchParams: Promise<{
    message?: string
  }>
}

export default async function AuthCodeErrorPage({
  searchParams,
}: AuthCodeErrorPageProps) {
  const { message } = await searchParams

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-[#1A1814]">
        Sign in could not be completed
      </h1>
      <p className="mt-3 text-sm text-[#6B6860]">
        {message ?? 'The authentication callback did not return a valid code.'}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#E8820C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#d97706]"
      >
        Back to home
      </Link>
    </main>
  )
}
