import { cn } from '@/lib/utils'
import { geist, fontMono } from '@/lib/fonts'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontMono.variable, 'font-sans', geist.variable)}
    >
      <body suppressHydrationWarning className="overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
