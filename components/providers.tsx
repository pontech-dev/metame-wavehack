'use client'

import * as React from 'react'
// import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

import { WagmiProvider, useSendTransaction, createConfig } from 'wagmi'
import { sepolia, polygonAmoy } from 'viem/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

import { BiconomyProvider } from '@biconomy/use-aa'
import { http } from 'viem'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'

const queryClient = new QueryClient()

export function Providers({ children, ...props }: ThemeProviderProps) {
  const biconomyPaymasterApiKey =
    process.env.NEXT_PUBLIC_PAYMASTER_API_KEY || ''
  const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL || ''

  const config = createConfig({
    chains: [polygonAmoy],
    transports: {
      [polygonAmoy.id]: http()
    },
    connectors: []
  })

  // const config = createConfig({
  //   chains: [sepolia],
  //   transports: {
  //     [sepolia.id]: http()
  //   }
  // })

  return (
    <WagmiProvider config={config}>
      <SidebarProvider>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <BiconomyProvider
              config={{
                biconomyPaymasterApiKey,
                bundlerUrl
              }}
              queryClient={queryClient}
            >
              <TooltipProvider>{children}</TooltipProvider>
            </BiconomyProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </SidebarProvider>
    </WagmiProvider>
  )
}
