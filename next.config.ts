import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google OAuth profile avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Supabase Storage (avatars, cover photos, chat images, product photos)
      { protocol: 'https', hostname: 'icmbxrtgxhjtttzucmfd.supabase.co' },
    ],
  },
}

export default withNextIntl(nextConfig)
