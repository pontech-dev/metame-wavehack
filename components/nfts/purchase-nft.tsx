'use client'

import {
  CardIcon,
  GoogleIcon,
  LockIcon,
  SparklesIcon
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { readStreamableValue, useActions, useUIState } from 'ai/rsc'
import { useEffect, useState } from 'react'

import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { useAccount, useSendTransaction } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'

import { OpenSeaSDK, Chain, OrderSide } from 'opensea-js'
import { ethers } from 'ethers'

type Status =
  | 'requires_confirmation'
  | 'requires_code'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'in_progress'

interface PurchaseProps {
  status: Status
  contractAddress: string
  tokenId: string
}

export const suggestions = [
  'Show flight status',
  'Show boarding pass for flight'
]

export const PurchaseNFT = ({
  status = 'requires_confirmation',
  contractAddress,
  tokenId
}: PurchaseProps) => {
  const [currentStatus, setCurrentStatus] = useState(status)
  const { requestCode, validateCode, submitUserMessage } = useActions()
  const [display, setDisplay] = useState(null)
  const [_, setMessages] = useUIState()

  const account = useAccount()

  const provider = new ethers.BrowserProvider(window?.ethereum)

  const openseaSDK = provider
    ? // @ts-ignore
      new OpenSeaSDK(provider, {
        chain: Chain.Mainnet,
        apiKey: process.env.NEXT_PUBLIC_OPENSEA_API_KEY
      })
    : null

  const [nftData, setNftData] = useState<any>({})
  const [order, setOrder] = useState<any>({})

  useEffect(() => {
    const fetchNFTData = async () => {
      const nftData = await openseaSDK?.api.getNFT(
        contractAddress,
        tokenId,
        Chain.Mainnet
      )
      if (!nftData) return
      setNftData(nftData.nft)
      console.log(nftData, 'nftData')
    }
    fetchNFTData()

    const fetchOrder = async () => {
      const order = await openseaSDK?.api.getOrder({
        side: OrderSide.ASK,
        assetContractAddress: contractAddress,
        tokenId: tokenId
      })
      console.log(order, 'order')
      setOrder(order)
    }
    fetchOrder()
  }, [])

  const fulfillOrder = async () => {
    console.log(account, 'account')
    if (!account) return
    if (!order) return
    console.log(order, 'order')
    try {
      const transactionHash = await openseaSDK?.fulfillOrder({
        order,
        accountAddress: account.address!
      })

      console.log(transactionHash, 'transactionHash')
    } catch (e) {
      console.log(e, 'error')
      alert(e)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 p-4 sm:p-6 border border-zinc-200 rounded-2xl bg-white">
        <div className="flex">
          <div className="flex items-center gap-2 text-zinc-950">
            <div className="size-6 flex items-center justify-center bg-zinc-100 rounded-full text-zinc-500 [&>svg]:size-3">
              <CardIcon />
            </div>
            <div className="text-sm text-zinc-600">{nftData.name}</div>
          </div>
          {/* <div className="text-sm flex ml-auto items-center gap-1 border border-zinc-200 px-3 py-0.5 rounded-full">
            <GoogleIcon />
            Pay
          </div> */}
        </div>
        {currentStatus === 'requires_confirmation' ? (
          <div className="flex flex-col gap-4">
            <img
              src={nftData?.image_url}
              className="object-cover aspect-square w-64"
              alt="nft img"
            />
            {/* <div className="sm:text-right font-medium font-mono">
              ${ethers.formatEther(order?.currentPrice)}ETH
            </div> */}
            <div className="font-medium font-mono text-zinc-600">
              ${' '}
              {order.currentPrice ? ethers.formatEther(order?.currentPrice) : 0}{' '}
              ETH
            </div>
            <div className="text-xs text-zinc-600">{order?.createdDate}</div>
            <p className="">ウォレットを接続して購入してください。</p>
            {account.isConnected ? (
              <button
                className="p-2 text-center rounded-full cursor-pointer bg-zinc-900 text-zinc-50 hover:bg-zinc-600 transition-colors"
                onClick={async () => await fulfillOrder()}
              >
                購入
              </button>
            ) : (
              // <ConnectButton />
              <></>
            )}
          </div>
        ) : currentStatus === 'requires_code' ? (
          <>
            <div>
              Enter the code sent to your phone (***) *** 6137 to complete your
              purchase.
            </div>
            <div className="flex justify-center p-2 text-center border rounded-full text-zinc-950">
              <input
                className="w-16 text-center bg-transparent outline-none tabular-nums"
                type="text"
                maxLength={6}
                placeholder="------"
                autoFocus
              />
            </div>
            <button
              className="p-2 text-center rounded-full cursor-pointer bg-zinc-900 text-zinc-50 hover:bg-zinc-600 transition-colors"
              onClick={async () => {
                const { status, display } = await validateCode()

                for await (const statusFromStream of readStreamableValue(
                  status
                )) {
                  setCurrentStatus(statusFromStream as Status)
                  setDisplay(display)
                }
              }}
            >
              Submit
            </button>
          </>
        ) : currentStatus === 'completed' || currentStatus === 'in_progress' ? (
          display
        ) : currentStatus === 'expired' ? (
          <div className="flex items-center justify-center gap-3">
            Your Session has expired!
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          'flex flex-col sm:flex-row items-start gap-2',
          currentStatus === 'completed' ? 'opacity-100' : 'opacity-0'
        )}
      >
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors bg-zinc-50 hover:bg-zinc-100 rounded-xl cursor-pointer"
            onClick={async () => {
              const response = await submitUserMessage(suggestion)
              setMessages((currentMessages: any[]) => [
                ...currentMessages,
                response
              ])
            }}
          >
            <SparklesIcon />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
