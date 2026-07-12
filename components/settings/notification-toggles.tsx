'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Preferences = {
  new_messages: boolean
  listing_updates: boolean
  new_followers: boolean
}

type PreferenceField = keyof Preferences

const TOGGLE_ITEMS: { field: PreferenceField; label: string; description: string }[] = [
  {
    field: 'new_messages',
    label: 'New messages',
    description: 'Get notified when someone messages you',
  },
  {
    field: 'listing_updates',
    label: 'Listing updates',
    description: 'Know when your listing is approved or rejected',
  },
  {
    field: 'new_followers',
    label: 'New followers',
    description: 'Find out when someone follows you',
  },
]

export function NotificationToggles({
  initialPreferences,
  userId,
}: {
  initialPreferences: Preferences
  userId: string
}) {
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences)

  return (
    <>
      {TOGGLE_ITEMS.map((item, index) => (
        <div key={item.field}>
          {index > 0 && <SettingsDivider />}
          <ToggleRow
            field={item.field}
            label={item.label}
            description={item.description}
            on={preferences[item.field]}
            userId={userId}
            onChange={(value) => setPreferences((prev) => ({ ...prev, [item.field]: value }))}
          />
        </div>
      ))}
    </>
  )
}

function SettingsDivider() {
  return <div className="mx-4 h-px bg-[#F3F4F6]" />
}

function ToggleRow({
  field,
  label,
  description,
  on,
  userId,
  onChange,
}: {
  field: PreferenceField
  label: string
  description: string
  on: boolean
  userId: string
  onChange: (value: boolean) => void
}) {
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleToggle = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const previousValue = on
    const nextValue = !on
    onChange(nextValue)
    setStatus('idle')

    const supabase = createClient()
    const { error } = await supabase
      .from('notification_preferences')
      .update({ [field]: nextValue, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      onChange(previousValue)
      setStatus('error')
      timeoutRef.current = setTimeout(() => setStatus('idle'), 2000)
      return
    }

    setStatus('saved')
    timeoutRef.current = setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1F2937]">{label}</p>
        <p className="text-xs text-[#9CA3AF]">{description}</p>
      </div>
      <span
        className={`text-xs font-medium transition-opacity duration-500 ${
          status === 'idle' ? 'opacity-0' : 'opacity-100'
        } ${status === 'error' ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}
        aria-live="polite"
      >
        {status === 'saved' ? 'Saved ✓' : status === 'error' ? "Couldn't save" : ''}
      </span>
      <ToggleSwitch on={on} onClick={handleToggle} />
    </div>
  )
}

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-200 ${on ? 'bg-[#F36D21]' : 'bg-[#D1D5DB]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}
