'use client'

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Check, Eye, EyeOff, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sanitizeUsername } from '@/lib/sanitize'
import { useRouter } from 'next/navigation'

type AuthMode = 'login' | 'register' | 'forgot'
type Screen = 'form' | 'otp' | 'reset-sent'
type FieldErrors = { email?: string; password?: string; username?: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function validateEmail(val: string): string | undefined {
  if (!val) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.'
}

function validatePassword(val: string): string | undefined {
  if (!val) return 'Password is required.'
  if (val.length < 6) return 'Password must be at least 6 characters.'
}

function getStrength(pwd: string): { level: number; label: string; color: string } {
  if (pwd.length < 8) return { level: 1, label: 'Weak', color: '#C0392B' }
  const score = [/[A-Z]/.test(pwd), /\d/.test(pwd), /[^A-Za-z0-9]/.test(pwd)].filter(
    Boolean
  ).length
  if (score >= 3) return { level: 4, label: 'Strong', color: '#1A7A4A' }
  if (score >= 2) return { level: 3, label: 'Good', color: '#D97706' }
  return { level: 2, label: 'Fair', color: '#F36D21' }
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className="animate-spin"
      style={{
        display: 'inline-block',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        border: `2px solid ${dark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.3)'}`,
        borderTopColor: dark ? '#1A1814' : '#fff',
        flexShrink: 0,
      }}
    />
  )
}

function StrengthMeter({ password }: { password: string }) {
  const { level, label, color } = getStrength(password)
  return (
    <div style={{ marginBottom: '10px', marginTop: '-2px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map((b) => (
          <div
            key={b}
            style={{
              flex: 1,
              height: '3px',
              borderRadius: '2px',
              background: b <= level ? color : '#E5E7EB',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '11px', color }}>{label}</span>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
      {error && (
        <span
          style={{ display: 'block', fontSize: '11px', color: '#C0392B', marginTop: '3px' }}
        >
          {error}
        </span>
      )}
    </label>
  )
}

function EmailSentScreen({
  heading,
  body,
  onBack,
}: {
  heading: string
  body: ReactNode
  onBack: () => void
}) {
  return (
    <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#FEF3E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <Mail size={26} color="#F36D21" />
      </div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1814', margin: '0 0 8px' }}>
        {heading}
      </h2>
      <p style={{ fontSize: '13px', color: '#6B6860', lineHeight: 1.6, margin: '0 0 24px' }}>
        {body}
      </p>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#6B6860',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        ← Back to sign in
      </button>
    </div>
  )
}

// ── Root export ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onClose: () => void
  initialMode?: AuthMode
  redirectTo?: string
}

export default function AuthModal({
  open,
  onClose,
  initialMode = 'login',
  redirectTo,
}: Props) {
  if (!open) return null
  return (
    <AuthModalContent
      key={initialMode}
      initialMode={initialMode}
      onClose={onClose}
      redirectTo={redirectTo}
    />
  )
}

// ── Inner component (owns all state) ──────────────────────────────────────────

function AuthModalContent({
  initialMode,
  onClose,
  redirectTo,
}: {
  initialMode: AuthMode
  onClose: () => void
  redirectTo?: string
}) {
  // ── Form state ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [screen, setScreen] = useState<Screen>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // ── Resend cooldown ───────────────────────────────────────────────────────
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── OTP state ─────────────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [focusedBox, setFocusedBox] = useState<number | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null, null, null])
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Cleanup intervals/timeouts on unmount
  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    },
    []
  )

  // Auto-focus first OTP box when screen switches to otp
  useEffect(() => {
    if (screen !== 'otp') return
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 50)
    return () => clearTimeout(t)
  }, [screen])

  // ── Cooldown ──────────────────────────────────────────────────────────────

  function startCooldown() {
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  // ── Mode switching ────────────────────────────────────────────────────────

  function switchMode(next: AuthMode) {
    setMode(next)
    setScreen('form')
    setError(null)
    setFieldErrors({})
  }

  function clearFieldError(field: keyof FieldErrors) {
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: undefined }))
  }

  // ── Auth handlers ──────────────────────────────────────────────────────────

  const handleEmailAuth = async (event: { preventDefault(): void }) => {
    event.preventDefault()
    setError(null)

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    const errs: FieldErrors = {}

    const emailErr = validateEmail(trimmedEmail)
    const pwdErr = validatePassword(trimmedPassword)
    if (emailErr) errs.email = emailErr
    if (pwdErr) errs.password = pwdErr
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('Please enter your full name.')
        return
      }
      if (!username) {
        setFieldErrors({ username: 'Please choose a username.' })
        return
      }
    }

    setLoading(true)

    if (mode === 'register') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: { data: { full_name: fullName.trim(), username: sanitizeUsername(username) } },
      })
      setLoading(false)
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      // session is null when email verification (OTP) is required
      if (!data.session) {
        setEmail(trimmedEmail)
        setDigits(['', '', '', '', '', '', '', ''])
        setOtpVerified(false)
        startCooldown()
        setScreen('otp')
        return
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      })
      setLoading(false)
      if (signInError) {
        setError(signInError.message)
        return
      }
    }

    onClose()
    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.refresh()
    }
  }

  const handleForgotPassword = async (event: { preventDefault(): void }) => {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const trimmedEmail = email.trim().toLowerCase()
    const emailErr = validateEmail(trimmedEmail)
    if (emailErr) {
      setFieldErrors({ email: emailErr })
      return
    }

    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setScreen('reset-sent')
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })

    if (oauthError || !data.url) {
      setError(oauthError?.message ?? 'Could not start Google sign in.')
      setGoogleLoading(false)
      return
    }

    window.location.assign(data.url)
    // googleLoading stays true — page is navigating away
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    await supabase.auth.resend({ type: 'signup', email })
    startCooldown()
  }

  const handleVerifyOtp = async () => {
    const token = digits.join('')
    if (token.length < 8 || otpLoading || otpVerified) return

    setOtpLoading(true)
    setError(null)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    setOtpLoading(false)

    if (verifyError) {
      setError('Invalid or expired code. Please try again.')
      setDigits(['', '', '', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 0)
      return
    }

    // 1-second success flash then close
    setOtpVerified(true)
    successTimeoutRef.current = setTimeout(() => {
      onClose()
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    }, 1000)
  }

  // ── OTP digit handlers ────────────────────────────────────────────────────

  function handleOtpChange(i: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = char
    setDigits(next)
    if (char && i < 7) inputRefs.current[i + 1]?.focus()
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits]
      next[i - 1] = ''
      setDigits(next)
      inputRefs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputRefs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < 7) {
      inputRefs.current[i + 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (!paste) return
    const next = Array(8).fill('') as string[]
    for (let j = 0; j < paste.length; j++) next[j] = paste[j]
    setDigits(next)
    inputRefs.current[Math.min(paste.length, 7)]?.focus()
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const anyLoading = loading || googleLoading
  const otpComplete = digits.join('').length === 8

  const headings: Record<AuthMode, string> = {
    login: 'Welcome back',
    register: 'Create your account',
    forgot: 'Reset password',
  }
  const subtitles: Record<AuthMode, string> = {
    login: 'Sign in to continue to FoxVent',
    register: 'Join the FoxVent community',
    forgot: 'Enter your email to get a reset link',
  }
  const submitLabels: Record<AuthMode, string> = {
    login: 'Sign in',
    register: 'Create account',
    forgot: 'Send reset link',
  }
  const loadingLabels: Record<AuthMode, string> = {
    login: 'Signing in...',
    register: 'Creating account...',
    forgot: 'Sending link...',
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative h-full w-full overflow-y-auto rounded-t-3xl bg-white/95 p-8 backdrop-blur-2xl sm:h-auto sm:max-h-[90vh] sm:w-95 sm:max-w-[90vw] sm:rounded-[14px] sm:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="Close">
          ×
        </button>

        {/* ── OTP verification screen ── */}
        {screen === 'otp' && (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#FEF3E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Mail size={32} color="#F36D21" />
              </div>
              <h2
                id="auth-modal-title"
                style={{ fontSize: '20px', fontWeight: 700, color: '#1A1814', margin: '0 0 8px' }}
              >
                Check your email
              </h2>
              <p style={{ fontSize: '13px', color: '#6B6860', lineHeight: 1.6 }}>
                We sent an 8-digit code to <strong>{email}</strong>. Enter it below to verify
                your account.
              </p>
            </div>

            {/* PIN boxes */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  disabled={otpLoading || otpVerified}
                  onFocus={(e) => {
                    e.target.select()
                    setFocusedBox(i)
                  }}
                  onBlur={() => setFocusedBox(null)}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  className="size-11 rounded-xl border-2 text-center text-xl font-bold outline-none transition-colors focus:ring-2 focus:ring-[#F36D21]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:size-13"
                  style={{
                    borderColor: focusedBox === i || digit ? '#F36D21' : '#E5E7EB',
                    color: '#1A1814',
                    background: '#fff',
                  }}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#C0392B',
                  textAlign: 'center',
                  marginBottom: '12px',
                }}
              >
                {error}
              </p>
            )}

            {/* Verify button */}
            <button
              type="button"
              disabled={!otpComplete || otpLoading || otpVerified}
              onClick={handleVerifyOtp}
              style={{
                ...submitButtonStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: otpVerified ? '#1A7A4A' : '#E8820C',
                cursor: !otpComplete || otpLoading || otpVerified ? 'not-allowed' : 'pointer',
                opacity: !otpComplete && !otpVerified ? 0.5 : 1,
                marginBottom: '16px',
                transition: 'background 0.3s',
              }}
            >
              {otpVerified ? (
                <>
                  <Check size={16} />
                  Verified!
                </>
              ) : otpLoading ? (
                <>
                  <Spinner />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>

            {/* Footer links */}
            <div
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleResend}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#9CA3AF' : '#E8820C',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScreen('form')
                  setDigits(['', '', '', '', '', '', '', ''])
                  setError(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B6860',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Wrong email? Go back
              </button>
            </div>
          </div>
        )}

        {/* ── Reset link sent screen ── */}
        {screen === 'reset-sent' && (
          <EmailSentScreen
            heading="Check your inbox"
            body="We sent a password reset link to your email. Click it to choose a new password."
            onBack={() => switchMode('login')}
          />
        )}

        {/* ── Form screen ── */}
        {screen === 'form' && (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
                FoxVent
              </div>
              <h2
                id="auth-modal-title"
                style={{ fontSize: '20px', fontWeight: 700, color: '#1A1814', margin: 0 }}
              >
                {headings[mode]}
              </h2>
              <p style={{ fontSize: '13px', color: '#6B6860', marginTop: '4px' }}>
                {subtitles[mode]}
              </p>
            </div>

            {/* Google OAuth — hidden for forgot */}
            {mode !== 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={anyLoading}
                  style={{
                    ...googleButtonStyle,
                    cursor: anyLoading ? 'not-allowed' : 'pointer',
                    opacity: anyLoading ? 0.7 : 1,
                  }}
                >
                  {googleLoading ? (
                    <>
                      <Spinner dark />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#FFC107" d="M43.6 20.5h-1.9V20.5H24v7h11.3c-1.6 4.5-5.9 7.5-11.3 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.5-5.5C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
                        <path fill="#FF3D00" d="M6.3 14.7l5.8 4.2C13.6 15.2 18.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.5-5.5C34.6 5.1 29.6 3 24 3 16.3 3 9.6 7.3 6.3 14.7z" />
                        <path fill="#4CAF50" d="M24 45c5.4 0 10.3-1.8 14-5l-6.5-5.4C29.7 36.3 27 37 24 37c-5.4 0-10-3.6-11.6-8.5l-6.6 5.1C9.4 40.5 16.1 45 24 45z" />
                        <path fill="#1976D2" d="M43.6 20.5H24v7h11.3c-1 2.7-2.8 4.9-5.2 6.4l6.5 5.4C40.6 35.8 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <div style={dividerStyle}>
                  <div style={dividerLineStyle} />
                  <span style={{ fontSize: '12px', color: '#6B6860' }}>or</span>
                  <div style={dividerLineStyle} />
                </div>
              </>
            )}

            {/* Email / password form */}
            <form onSubmit={mode === 'forgot' ? handleForgotPassword : handleEmailAuth}>
              {mode === 'register' && (
                <>
                  <FormField label="Full name">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={anyLoading}
                      style={{ ...inputStyle, opacity: anyLoading ? 0.6 : 1 }}
                      className={inputClassName}
                      placeholder="Alex Verma"
                      autoComplete="name"
                    />
                  </FormField>

                  <FormField
                    label={`Username${username.length > 0 ? ` (${username.length}/30)` : ''}`}
                    error={fieldErrors.username}
                  >
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => {
                        const v = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9._]/g, '')
                          .slice(0, 30)
                        setUsername(v)
                        clearFieldError('username')
                      }}
                      disabled={anyLoading}
                      style={{ ...inputStyle, opacity: anyLoading ? 0.6 : 1 }}
                      className={inputClassName}
                      placeholder="alex.verma"
                      autoComplete="username"
                    />
                  </FormField>
                </>
              )}

              <FormField label="Email address" error={fieldErrors.email}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearFieldError('email')
                  }}
                  disabled={anyLoading}
                  style={{ ...inputStyle, opacity: anyLoading ? 0.6 : 1 }}
                  className={inputClassName}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </FormField>

              {mode !== 'forgot' && (
                <>
                  <FormField label="Password" error={fieldErrors.password}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          clearFieldError('password')
                        }}
                        disabled={anyLoading}
                        style={{
                          ...inputStyle,
                          paddingRight: '36px',
                          opacity: anyLoading ? 0.6 : 1,
                        }}
                        className={inputClassName}
                        placeholder="••••••••"
                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#8A8178',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </FormField>

                  {mode === 'register' && password.length > 0 && (
                    <StrengthMeter password={password} />
                  )}
                </>
              )}

              {error && <div style={errorStyle}>{error}</div>}

              <button
                type="submit"
                disabled={anyLoading}
                style={{
                  ...submitButtonStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: anyLoading ? 'not-allowed' : 'pointer',
                  opacity: anyLoading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <Spinner />
                    {loadingLabels[mode]}
                  </>
                ) : (
                  submitLabels[mode]
                )}
              </button>
            </form>

            {/* Forgot password link */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <button
                  type="button"
                  style={{ ...switchButtonStyle, fontSize: '12px' }}
                  onClick={() => switchMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Switch mode */}
            <div style={switchTextStyle}>
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    style={switchButtonStyle}
                    onClick={() => switchMode('register')}
                  >
                    Sign up
                  </button>
                </>
              ) : mode === 'register' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    style={switchButtonStyle}
                    onClick={() => switchMode('login')}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Remember your password?{' '}
                  <button
                    type="button"
                    style={switchButtonStyle}
                    onClick={() => switchMode('login')}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(20,18,16,0.4)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}


const closeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '14px',
  right: '14px',
  border: 'none',
  background: 'transparent',
  fontSize: '18px',
  cursor: 'pointer',
  color: '#6B6860',
}

const googleButtonStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  border: '1px solid #E2DDD5',
  borderRadius: '8px',
  background: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  marginBottom: '14px',
}

const dividerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  margin: '12px 0',
}

const dividerLineStyle: CSSProperties = {
  flex: 1,
  height: '1px',
  background: '#E2DDD5',
}

const fieldStyle: CSSProperties = {
  display: 'block',
  marginBottom: '10px',
}

const labelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#1A1814',
  display: 'block',
  marginBottom: '4px',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #E2DDD5',
  borderRadius: '7px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#1A1814',
}

const inputClassName = 'placeholder:text-[#8A8178]'

const errorStyle: CSSProperties = {
  fontSize: '12px',
  color: '#C0392B',
  marginBottom: '10px',
  padding: '8px 10px',
  background: '#FDEDEC',
  borderRadius: '6px',
}

const submitButtonStyle: CSSProperties = {
  width: '100%',
  padding: '11px',
  background: '#E8820C',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
}

const switchTextStyle: CSSProperties = {
  textAlign: 'center',
  marginTop: '14px',
  fontSize: '13px',
  color: '#6B6860',
}

const switchButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#E8820C',
  cursor: 'pointer',
  font: 'inherit',
  fontWeight: 500,
  padding: 0,
}
