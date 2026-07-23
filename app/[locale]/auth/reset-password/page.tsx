'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Handle the token from the email link
  useEffect(() => {
    async function handleToken() {
      // Get the hash from the URL (#access_token=...&type=recovery)
      const hash = window.location.hash
      
      if (!hash) {
        setError('Invalid or expired reset link. Please request a new one.')
        setVerifying(false)
        return
      }

      // Parse the hash params
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (type !== 'recovery' || !accessToken ||  !refreshToken) {
        setError('Invalid or expired reset link. Please request a new one.')
        setVerifying(false)
        return
      }

      // Set the session using the tokens from the email link
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError) {
        setError('This reset link has expired. Please request a new one.')
        setVerifying(false)
        return
      }

      // Session established — show the password form
      setVerifying(false)
    }

    handleToken()
  }, [supabase.auth])

  async function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/'), 2000)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-extrabold text-[#1A1814]">FoxVent</div>
          <h1 className="mt-2 text-xl font-bold text-[#1F2937]">
            Set new password
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Choose a strong password for your account.
          </p>
        </div>

        {/* Verifying token state */}
        {verifying && (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="inline-block size-6 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#F36D21]" />
            <p className="text-sm text-[#6B7280]">Verifying your link...</p>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="rounded-lg bg-[#F0FDF4] px-4 py-4 text-center">
            <p className="text-sm font-medium text-[#1A7A4A]">
              ✓ Password updated successfully!
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              Redirecting you home...
            </p>
          </div>
        )}

        {/* Error state (bad/expired link) */}
        {!verifying && error && !password && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#FDEDEC] px-4 py-3 text-center"><p className="text-sm text-[#C0392B]">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/?login=1')}
              className="w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
            >
              Back to login
            </button>
          </div>
        )}

        {/* Password form */}
        {!verifying && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#1A1814]">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-[#E2DDD5] px-3 py-2.5 pr-9 text-sm text-[#1A1814] outline-none placeholder:text-[#8A8178] focus:border-[#F36D21] disabled:opacity-60"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8178]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#1A1814]">
                Confirm password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-lg border border-[#E2DDD5] px-3 py-2.5 text-sm text-[#1A1814] outline-none placeholder:text-[#8A8178] focus:border-[#F36D21] disabled:opacity-60"
              />
            </div>

            {error && (
              <p className="rounded-md bg-[#FDEDEC] px-3 py-2 text-xs text-[#C0392B]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F36D21] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}