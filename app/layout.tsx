import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Source_Sans_3 } from 'next/font/google'
import { Suspense } from 'react'
import { RouteProgress } from '@/components/route-progress'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  weight: ['200', '300', '400'],
  variable: '--font-source-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Client Project Brief — NJENGA Productions Co.',
  description:
    'Tell us about your project. A short brief so the NJENGA Productions team can craft something legendary for you.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1a1a1a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const marqueeImages = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
    'R', 'S', 'T', 'U', 'V', 'W', 'X',
  ]

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${dmSerifDisplay.variable} ${sourceSans3.variable} bg-background font-sans antialiased`}>
      <head>
        {marqueeImages.map((name) => (
          <link key={name} rel="preload" as="image" href={`/images/${name}.png`} />
        ))}
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
