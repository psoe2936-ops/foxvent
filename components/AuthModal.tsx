'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AuthMode = 'login' | 'register'

type Props = {
  open: boolean
  onClose: () => void
  initialMode?: AuthMode
}

export default function AuthModal({
  open,
  onClose,
  initialMode = 'login',
}: Props) {
  if (!open) {
    return null
  }

  return (
    <AuthModalContent
      key={initialMode}
      initialMode={initialMode}
      onClose={onClose}
    />
  )
}

type AuthModalContentProps = {
  initialMode: AuthMode
  onClose: () => void
}

function AuthModalContent({ initialMode, onClose }: AuthModalContentProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError(null)
  }

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const trimmedEmail = email.trim()
    const trimmedFullName = fullName.trim()
    const trimmedUsername = username.trim()

    if (mode === 'register' && (!trimmedFullName || !trimmedUsername)) {
      setError('Please enter your full name and username.')
      setLoading(false)
      return
    }

    const authResult =
      mode === 'register'
        ? await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                full_name: trimmedFullName,
                username: trimmedUsername,
              },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          })

    if (authResult.error) {
      setError(authResult.error.message)
      setLoading(false)
      return
    }

   

    setLoading(false)
    onClose()
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.url) {
      setError('Could not start Google sign in.')
      setLoading(false)
      return
    }

    window.location.assign(data.url)
  }

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
        style={modalStyle}
      >
        <button
          type="button"
          onClick={onClose}
          style={closeButtonStyle}
          aria-label="Close"
        >
          x
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
            FoxVent
          </div>
          <h2
            id="auth-modal-title"
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1A1814',
              margin: 0,
            }}
          >
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ fontSize: '13px', color: '#6B6860', marginTop: '4px' }}>
            {mode === 'login'
              ? 'Sign in to continue to FoxVent'
              : 'Join the FoxVent community'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            ...googleButtonStyle,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5h-1.9V20.5H24v7h11.3c-1.6 4.5-5.9 7.5-11.3 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.5-5.5C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l5.8 4.2C13.6 15.2 18.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.5-5.5C34.6 5.1 29.6 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 45c5.4 0 10.3-1.8 14-5l-6.5-5.4C29.7 36.3 27 37 24 37c-5.4 0-10-3.6-11.6-8.5l-6.6 5.1C9.4 40.5 16.1 45 24 45z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H24v7h11.3c-1 2.7-2.8 4.9-5.2 6.4l6.5 5.4C40.6 35.8 44 30.4 44 24c0-1.2-.1-2.3-.4-3.5z"
            />
          </svg>
          {loading ? 'Please wait...' : 'Continue with Google'}
        </button>

        <div style={dividerStyle}>
          <div style={dividerLineStyle} />
          <span style={{ fontSize: '12px', color: '#6B6860' }}>or</span>
          <div style={dividerLineStyle} />
        </div>

        <form onSubmit={handleEmailAuth}>
          {mode === 'register' && (
            <>
              <FormField label="Full name">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  style={inputStyle}
                  className={inputClassName}
                  placeholder="Alex Verma"
                  autoComplete="name"
                />
              </FormField>

              <FormField label="Username">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value.toLowerCase().trim())
                  }
                  style={inputStyle}
                  className={inputClassName}
                  placeholder="alex.verma"
                  autoComplete="username"
                />
              </FormField>
            </>
          )}

          <FormField label="Email address">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
              className={inputClassName}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
              className={inputClassName}
              placeholder="********"
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
            />
          </FormField>

          {error && <div style={errorStyle}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButtonStyle,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <div style={switchTextStyle}>
          {mode === 'login' ? (
            <>
              Do not have an account?{' '}
              <button
                type="button"
                style={switchButtonStyle}
                onClick={() => switchMode('register')}
              >
                Sign up
              </button>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(20,18,16,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyle: CSSProperties = {
  background: '#fff',
  borderRadius: '14px',
  padding: '32px',
  width: '380px',
  maxWidth: '90vw',
  position: 'relative',
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
