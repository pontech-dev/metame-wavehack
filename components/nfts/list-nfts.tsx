'use client'

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { useActions, useUIState } from 'ai/rsc'

interface NFT {
  chain_id: string
  contract: string
  token_standard: string
  name: string
  description: string
  image_url: string
  metadata_url: string
  opensea_url: string
  identifier: string
  collection: string
}

interface ListNFTsProps {
  nfts: NFT[]
  args: {
    wallet_address: string
    genre: string
  }
}

export const ListNFTs = ({ nfts, args }: ListNFTsProps) => {
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState()

  const { wallet_address, genre } = args

  const formatTokenId = (tokenId: string) => {
    if (tokenId.length > 8) {
      return tokenId.slice(0, 8) + '...'
    }
    return tokenId
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-2 sm:p-4">
      <div className="grid gap-2 sm:flex sm:flex-row justify-between border-b p-2">
        <div className="sm:basis-1/4">
          <div className="text-xs text-zinc-600">Wallet Address</div>
          <div className="font-medium">{wallet_address}</div>
        </div>
        <div className="sm:basis-1/2">
          <div className="sm:text-right text-xs text-zinc-600">Genre</div>
          <div className="sm:text-right font-medium">{genre}</div>
        </div>
      </div>
      <div className="grid gap-3">
        {nfts &&
          nfts.map(nft => (
            <div
              key={nft.identifier}
              className="flex cursor-pointer flex-row items-start sm:items-center gap-4 rounded-xl p-2 hover:bg-zinc-50"
              onClick={async () => {
                const response = await submitUserMessage(
                  `The user has selected the NFT with token_id: ${nft.identifier} and contract: ${nft.contract}. now proceed to purchase this NFT`
                )
                setMessages((currentMessages: any[]) => [
                  ...currentMessages,
                  response
                ])
              }}
            >
              <div className="w-10 sm:w-12 shrink-0 aspect-square rounded-lg bg-zinc-50 overflow-hidden">
                <img
                  src={nft.image_url}
                  className="object-cover aspect-square"
                  alt="nft img"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-4 items-start sm:gap-6 flex-1">
                <div className="col-span-3">
                  <div className="font-medium">
                    {nft.name} - {nft.collection}
                  </div>
                  <div className="text-sm text-zinc-600">{nft.contract}</div>
                </div>
                <div>
                  <div className="font-medium">
                    token_id: {formatTokenId(nft.identifier)}
                  </div>
                  <div className="text-sm text-zinc-600">
                    {nft.token_standard}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
