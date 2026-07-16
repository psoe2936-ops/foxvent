import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

import '../globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import { NavbarServer } from '@/components/navbar/navbar-server'
import { createClient } from '@/lib/supabase/server'
import { SupportChatBubble } from '@/components/support/support-chat-bubble'
import { BottomNav } from '@/components/mobile/bottom-nav'
import { GlobalCallListener } from '@/components/chat/global-call-listener'
import { ToastProvider } from '@/components/ui/toast'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'FoxVend — Buy & Sell Second-Hand',
    template: '%s — FoxVent',
  },
  description:
    'FoxVend is a verified second-hand marketplace. Buy and sell pre-loved items safely.',
  openGraph: {
    siteName: 'FoxVend',
    type: 'website',
  },
}

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale — show 404 for unknown locales
  if (!routing.locales.includes(locale as 'en' | 'my')) {
    notFound()
  }

  // Load translation messages for this locale
  const messages = await getMessages()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { username: string | null; avatar_url: string | null } | null =
    null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        'antialiased',
        fontMono.variable,
        'font-sans',
        geist.variable
      )}
    >
      <body suppressHydrationWarning className="overflow-x-hidden">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <ToastProvider>
              <div className="min-h-screen bg-gradient-to-br from-[#FDF6F0] via-[#F9FAFB] to-[#FEF3E2]">
                <NavbarServer />
                <div className="pb-16 md:pb-0">{children}</div>
              </div>
              <SupportChatBubble userId={user?.id ?? null} />
              {user && <GlobalCallListener currentUserId={user.id} />}
              <BottomNav
                username={profile?.username ?? null}
                userId={user?.id ?? null}
              />
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}