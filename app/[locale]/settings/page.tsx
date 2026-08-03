import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
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
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/settings/logout-button'
import { PasswordResetButton } from '@/components/settings/password-reset-button'
import { DeleteAccountModal } from '@/components/settings/delete-account-modal'
import { NotificationToggles } from '@/components/settings/notification-toggles'
import { FeedSidebar } from '@/components/feed/sidebar'
import { HelpPromoCard } from '@/components/feed/help-promo-card'

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  const tAuth = await getTranslations('auth')
  const tChat = await getTranslations('chat')
  const tNotif = await getTranslations('notifications')
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
    <div className="w-full py-4 pb-24 lg:py-6 lg:pb-10">
      <div className="flex w-full items-start">
        <FeedSidebar username={profile?.username} userId={user.id} />

        <div className="min-w-0 flex-1 px-4 sm:px-6 lg:px-10">
          <main className="mx-auto max-w-2xl py-2">
      <h1 className="mb-5 text-xl font-bold text-[#1F2937]">{t('title')}</h1>

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
          {tChat('viewProfile')}
        </Link>
      </div>

      {/* Group 2 — Account */}
      <SettingsGroup label={t('accountGroup')}>
        <SettingsRow icon={<Mail className="size-4" />} label={tAuth('email')}>
          <span className="text-sm text-[#9CA3AF]">{user.email}</span>
          <span className="ml-2 rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] text-[#9CA3AF]">{t('readOnly')}</span>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow icon={<User className="size-4" />} label={tAuth('username')}>
          <span className="text-sm text-[#6B7280]">@{profile?.username}</span>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow icon={<KeyRound className="size-4" />} label={tAuth('password')}>
          <PasswordResetButton email={user.email!} />
        </SettingsRow>
      </SettingsGroup>

      {/* Group 3 — Notifications */}
      <SettingsGroup label={tNotif('title')}>
        <NotificationToggles initialPreferences={notificationPreferences} userId={user.id} />
      </SettingsGroup>

      {/* Group 4 — Privacy & Security */}
      <SettingsGroup label={t('privacySecurityGroup')}>
        <SettingsRow icon={<Smartphone className="size-4" />} label={t('activeSessions')}>
          <span className="text-sm text-[#9CA3AF]">{t('currentDevice')}</span>
        </SettingsRow>
        <SettingsDivider />
        <SettingsLinkRow icon={<Shield className="size-4" />} label={t('blockList')} href="/settings/blocked" />
        <SettingsDivider />

      </SettingsGroup>

      {/* Group 5 — Support */}
      <SettingsGroup label={t('supportGroup')}>
        <SettingsLinkRow icon={<HelpCircle className="size-4" />} label={t('helpFaq')} href="/help" />
        <SettingsDivider />
        <SettingsLinkRow icon={<MessageCircle className="size-4" />} label={t('reportProblem')} href="/about" />
        <SettingsDivider />
        <SettingsLinkRow icon={<Lock className="size-4" />} label={t('termsOfService')} href="/terms" />
        <SettingsDivider />
        <SettingsLinkRow icon={<ShieldAlert className="size-4" />} label={t('privacyPolicy')} href="/privacy" />
      </SettingsGroup>

      {/* Group 6 — Danger zone */}
      <div className="rounded-2xl border border-[#FDEDEC] bg-white shadow-sm">
        <p className="border-b border-[#FDEDEC] px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#C0392B]">
          {t('dangerZone')}
        </p>
        <div className="p-4">
          <LogoutButton />
        </div>
        <div className="border-t border-[#F3F4F6] px-4 py-3 text-center">
          <DeleteAccountModal />
        </div>
      </div>
          </main>
        </div>

        <aside className="scrollbar-none sticky top-20 hidden h-[calc(100vh-5rem)] w-[300px] shrink-0 flex-col overflow-y-auto border-l border-white/40 bg-white/60 py-6 pl-4 pr-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl xl:flex xl:pr-6">
          <div className="space-y-6">
            <HelpPromoCard />
          </div>
        </aside>
      </div>
    </div>
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

