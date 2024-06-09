'use client'

import * as React from 'react'
// import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider, useSendTransaction } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon],
  ssr: true // If your dApp uses server side rendering (SSR)
})

const queryClient = new QueryClient()

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <SidebarProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SidebarProvider>
  )
}
