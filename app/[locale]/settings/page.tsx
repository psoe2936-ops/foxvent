import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
  Database,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  ShieldAlert,
  Smartphone,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/settings/logout-button'
import { PasswordResetButton } from '@/components/settings/password-reset-button'
import { DeleteAccountModal } from '@/components/settings/delete-account-modal'
import { NotificationToggles } from '@/components/settings/notification-toggles'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const initial = (profile?.full_name ?? profile?.username ?? 'U')[0].toUpperCase()

  let { data: notificationPreferences } = await supabase
    .from('notification_preferences')
    .select('new_messages, listing_updates, new_followers')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!notificationPreferences) {
    const { data: createdPreferences } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          new_messages: true,
          listing_updates: true,
          new_followers: true,
        },
        { onConflict: 'user_id' }
      )
      .select('new_messages, listing_updates, new_followers')
      .single()

    notificationPreferences = createdPreferences ?? {
      new_messages: true,
      listing_updates: true,
      new_followers: true,
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:px-6 md:pb-8">
      <h1 className="mb-5 text-xl font-bold text-[#1F2937]">Settings</h1>

      {/* Group 1 — Profile card */}
      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <div className="shrink-0">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="size-16 rounded-full object-cover ring-2 ring-[#E5E7EB]"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-[#FEF3E2] text-xl font-bold text-[#C26A08]">
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#1F2937]">{profile?.full_name ?? profile?.username}</p>
          <p className="text-sm text-[#9CA3AF]">@{profile?.username}</p>
          <p className="truncate text-xs text-[#9CA3AF]">{user.email}</p>
        </div>
        <Link
          href={`/profile/${profile?.username}`}
          className="shrink-0 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#4B5563] hover:bg-[#F9FAFB]"
        >
          View profile
        </Link>
      </div>

      {/* Group 2 — Account */}
      <SettingsGroup label="Account">
        <SettingsRow icon={<Mail className="size-4" />} label="Email">
          <span className="text-sm text-[#9CA3AF]">{user.email}</span>
          <span className="ml-2 rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] text-[#9CA3AF]">Read-only</span>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow icon={<User className="size-4" />} label="Username">
          <span className="text-sm text-[#6B7280]">@{profile?.username}</span>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow icon={<KeyRound className="size-4" />} label="Password">
          <PasswordResetButton email={user.email!} />
        </SettingsRow>
      </SettingsGroup>

      {/* Group 3 — Notifications */}
      <SettingsGroup label="Notifications">
        <NotificationToggles initialPreferences={notificationPreferences} userId={user.id} />
      </SettingsGroup>

      {/* Group 4 — Privacy & Security */}
      <SettingsGroup label="Privacy & Security">
        <SettingsRow icon={<Smartphone className="size-4" />} label="Active sessions">
          <span className="text-sm text-[#9CA3AF]">Current device</span>
        </SettingsRow>
        <SettingsDivider />
        <SettingsLinkRow icon={<Shield className="size-4" />} label="Block list" href="/settings/blocked" />
        <SettingsDivider />
        <SettingsRow icon={<Database className="size-4" />} label="Download my data">
          <button
            type="button"
            disabled
            className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#9CA3AF]"
            title="Feature coming soon"
          >
            Coming soon
          </button>
        </SettingsRow>
      </SettingsGroup>

      {/* Group 5 — Support */}
      <SettingsGroup label="Support">
        <SettingsLinkRow icon={<HelpCircle className="size-4" />} label="Help & FAQ" href="/about" />
        <SettingsDivider />
        <SettingsLinkRow icon={<MessageCircle className="size-4" />} label="Report a problem" href="/about" />
        <SettingsDivider />
        <SettingsLinkRow icon={<Lock className="size-4" />} label="Terms of Service" href="/terms" />
        <SettingsDivider />
        <SettingsLinkRow icon={<ShieldAlert className="size-4" />} label="Privacy Policy" href="/privacy" />
      </SettingsGroup>

      {/* Group 6 — Danger zone */}
      <div className="rounded-2xl border border-[#FDEDEC] bg-white shadow-sm">
        <p className="border-b border-[#FDEDEC] px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#C0392B]">
          Danger zone
        </p>
        <div className="p-4">
          <LogoutButton />
        </div>
        <div className="border-t border-[#F3F4F6] px-4 py-3 text-center">
          <DeleteAccountModal />
        </div>
      </div>
    </main>
  )
}

function SettingsGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        {children}
      </div>
    </div>
  )
}

function SettingsDivider() {
  return <div className="mx-4 h-px bg-[#F3F4F6]" />
}

function SettingsRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-h-13 items-center gap-3 px-4 py-3">
      <span className="shrink-0 text-[#9CA3AF]">{icon}</span>
      <span className="flex-1 text-sm font-medium text-[#1F2937]">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function SettingsLinkRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex min-h-13 items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F9FAFB]"
    >
      <span className="shrink-0 text-[#9CA3AF]">{icon}</span>
      <span className="flex-1 text-sm font-medium text-[#1F2937]">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-[#D1D5DB]" />
    </Link>
  )
}

