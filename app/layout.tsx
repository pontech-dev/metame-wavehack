import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'
import { KasadaClient } from '@/lib/kasada/kasada-client'

import Web3ModalProvider from '@/context'
import { cookieToInitialState } from 'wagmi'

import { config } from '@/config'

import { headers } from 'next/headers'

export const metadata = {
  metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
  title: {
    default: 'Next.js Gemini Chatbot',
    template: `%s - Next.js Gemini Chatbot`
  },
  description:
    'Build your own generative UI chatbot using the Vercel AI SDK and Google Gemini',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const initialState = cookieToInitialState(config, headers().get('cookie'))

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <Toaster position="top-center" />
        <Web3ModalProvider initialState={initialState}>
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex flex-col flex-1">{children}</main>
            </div>
            {/* <TailwindIndicator /> */}
          </Providers>
        </Web3ModalProvider>
        <Analytics />
      </body>
    </html>
  )
}
