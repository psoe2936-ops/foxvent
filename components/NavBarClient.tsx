'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthModal from './AuthModal'
import Link from 'next/link'

type Props = {
  user: { id: string; email?: string } | null
  profile: { username: string; full_name: string; avatar_url: string | null } | null
}

export default function NavBarClient({ user, profile }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode)
    setModalOpen(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.refresh()
  }

  // Initials for avatar fallback
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Sell button */}
        <Link
          href={user ? '/products/new' : '#'}
          onClick={(e) => {
            if (!user) {
              e.preventDefault()
              openModal('login')
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#E8820C',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + Sell
        </Link>

        {user ? (
          <>
            {/* Message icon */}
            <Link href="/chat" style={{ fontSize: '18px', color: '#6B6860', position: 'relative', textDecoration: 'none' }} aria-label="Messages">
              💬
            </Link>

            {/* Notification icon */}
            <button style={{ fontSize: '18px', color: '#6B6860', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }} aria-label="Notifications">
              🔔
              <span style={{
                position: 'absolute', top: '-2px', right: '-4px',
                background: '#E24B4A', color: '#fff', fontSize: '10px',
                borderRadius: '10px', padding: '0 5px', fontWeight: 700,
              }}>3</span>
            </button>

            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: '#FEF3E2', color: '#C26A08',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                }}>
                  {initials}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1814' }}>
                    {profile?.full_name || 'User'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B6860' }}>View profile</div>
                </div>
                <span style={{ fontSize: '12px', color: '#6B6860' }}>▾</span>
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '46px', right: 0,
                  background: '#fff', border: '1px solid #E2DDD5',
                  borderRadius: '8px', minWidth: '160px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  zIndex: 100,
                }}>
                  <Link href="/dashboard" style={dropdownItemStyle} onClick={() => setDropdownOpen(false)}>My profile</Link>
                  <Link href="/dashboard" style={dropdownItemStyle} onClick={() => setDropdownOpen(false)}>My listings</Link>
                  <Link href="/settings" style={dropdownItemStyle} onClick={() => setDropdownOpen(false)}>Settings</Link>
                  <div style={{ height: '1px', background: '#E2DDD5', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={{ ...dropdownItemStyle, width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#C0392B' }}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => openModal('login')}
              style={{
                background: 'transparent', border: '1px solid #E2DDD5',
                color: '#1A1814', padding: '8px 16px', borderRadius: '7px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Log in
            </button>
            <button
              onClick={() => openModal('register')}
              style={{
                background: '#1A1814', color: '#fff', border: 'none',
                padding: '8px 16px', borderRadius: '7px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Sign up
            </button>
          </>
        )}
      </div>

      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  )
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '9px 14px',
  fontSize: '13px',
  color: '#1A1814',
  textDecoration: 'none',
}