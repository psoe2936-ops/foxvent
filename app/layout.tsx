import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FoxVend — Buy & Sell Second-Hand',
    template: '%s — FoxVend',
  },
  description:
    'FoxVend is a verified second-hand marketplace. Buy and sell pre-loved items safely.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}