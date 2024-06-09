'use client'

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { useActions, useUIState } from 'ai/rsc'
import { ethers } from 'ethers'

interface Order {
  created_date: string
  closing_date: string
  listing_time: number
  expiration_time: number
  order_hash: string
  protocol_data: [Object]
  protocol_address: string
  current_price: string
  maker: {
    user: number
    profile_img_url: string
    address: string
  }
  order_type: string
}

interface ListOrdersProps {
  orders: Order[]
  contractAddress: string
  tokenId: string
}

export const ListOrders = ({
  orders,
  contractAddress,
  tokenId
}: ListOrdersProps) => {
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState()

  console.log(orders)

  return (
    <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-2 sm:p-4">
      <div className="grid gap-2 sm:flex sm:flex-row justify-between border-b p-2">
        <div className="sm:basis-1/4">
          <div className="text-xs text-zinc-600">Wallet Address</div>
          <div className="font-medium">{}</div>
        </div>
        {/* <div className="sm:basis-1/2">
          <div className="sm:text-right text-xs text-zinc-600">Date</div>
          <div className="sm:text-right font-medium">{date}</div>
        </div> */}
      </div>
      <div className="grid gap-3">
        {orders &&
          orders.length > 0 &&
          orders.map(order => (
            <div
              key={order.order_hash}
              className="flex cursor-pointer flex-row items-start sm:items-center gap-4 rounded-xl p-2 hover:bg-zinc-50"
              onClick={async () => {
                const response = await submitUserMessage(
                  `The user has selected the order ${order.order_hash}. Contract Address: ${contractAddress}, TokenId: ${tokenId}. now proceed to purchase the NFT.`
                )
                setMessages((currentMessages: any[]) => [
                  ...currentMessages,
                  response
                ])
              }}
            >
              <div className="w-10 sm:w-12 shrink-0 aspect-square rounded-lg bg-zinc-50 overflow-hidden">
                <img
                  src={order.maker.profile_img_url}
                  className="object-cover aspect-square"
                  alt="airline logo"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-4 items-start sm:gap-6 flex-1">
                <div className="col-span-3">
                  <div className="font-medium">{`${order.maker.address.slice(0, 12)}...`}</div>
                  {/* <div className="text-sm text-zinc-600">{nft.contract}</div> */}
                </div>
                <div>
                  <div className="sm:text-right font-medium font-mono">
                    ${ethers.formatEther(order.current_price)}ETH
                  </div>
                  <div className="sm:text-right text-xs text-zinc-600">
                    {order.created_date}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
