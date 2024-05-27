// @ts-nocheck

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  createStreamableValue
} from 'ai/rsc'

import { BotCard, BotMessage } from '@/components/stocks'

import { nanoid, sleep } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '../types'
import { auth } from '@/auth'
import { FlightStatus } from '@/components/flights/flight-status'
import { SelectSeats } from '@/components/flights/select-seats'
import { ListFlights } from '@/components/flights/list-flights'
import { ListNFTs } from '@/components/nfts/list-nfts'
import { ListOrders } from '@/components/nfts/list-orders'
import { BoardingPass } from '@/components/flights/boarding-pass'
import { PurchaseTickets } from '@/components/flights/purchase-ticket'
import { CheckIcon, SpinnerIcon } from '@/components/ui/icons'
import { format } from 'date-fns'
import {
  experimental_streamText,
  OpenAIStream,
  StreamingTextResponse
} from 'ai'
import { google } from 'ai/google'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

import { z } from 'zod'
import { ListHotels } from '@/components/hotels/list-hotels'
import { Destinations } from '@/components/flights/destinations'
import { Video } from '@/components/media/video'
import { rateLimit } from './ratelimit'

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

// ウォレットアドレスに対しておすすめのNFTを取得する関数
async function getRecommendedNFTs(
  walletAddress: string,
  chainId: number = 1,
  limit: number = 3,
  genre: string = 'art'
) {
  const url =
    'https://nft-hackathon.api-ai.d-metacommunication-stg.com/match/user'
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'hackason-opensea-2024_XXX'
  }
  const payload = {
    chain_id: chainId,
    wallet_address: walletAddress,
    limit: limit,
    genre: genre
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })
    console.log('response:', response)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching recommended NFTs:', error)
    throw error
  }
}

const getNFTDetails = async (contractAddress: string, tokenId: string) => {
  const url = `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}/nfts/${tokenId}`
  const headers = {
    accept: 'application/json',
    'x-api-key': process.env.OPENSEA_API_KEY || ''
  }

  try {
    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }
    const data = await response.json()
    return data.nft
  } catch (error) {
    console.error('Error fetching NFT details:', error)
    throw error
  }
}

const getNFTOrders = async (contractAddress: string, tokenId: string) => {
  const url = `https://api.opensea.io/api/v2/orders/ethereum/seaport/listings?asset_contract_address=${contractAddress}&token_ids=${tokenId}&limit=5`
  const headers = {
    accept: 'application/json',
    'x-api-key': process.env.OPENSEA_API_KEY || ''
  }

  try {
    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`)
    }
    const data = await response.json()
    console.log(data, 'data')
    return data
  } catch (error) {
    console.error('Error fetching NFT details:', error)
    throw error
  }
}

// Function definition:
const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: 'getRecommendedNFTs',
    description: 'Get recommended NFTs for wallet',
    parameters: {
      type: 'object',
      properties: {
        wallet_address: { type: 'string' },
        chain_id: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 3 },
        genre: {
          type: 'string',
          default: 'art',
          enum: ['art', 'music', 'game', 'membership', 'pfp', 'photo', 'world']
        }
      },
      required: ['wallet_address']
    }
  },
  {
    name: 'getNFTOrders',
    description: 'Get orders for a given NFT contractAddress and tokenId',
    parameters: {
      type: 'object',
      properties: {
        contractAddress: { type: 'string' },
        tokenId: { type: 'string' }
      },
      required: ['contractAddress', 'tokenId']
    }
  }
]

async function submitUserMessage(content: string) {
  'use server'

  await rateLimit()

  console.log(content, 'content')

  const messages = [
    {
      role: 'system',
      content: `You are a helpful assistant. 
        Here's the flow: 
        1. List Reccomended nfts for a given wallet address.
        2. List Opensea's orders for a selected NFT.
        3. Choose an Order.
        4. fulfill the Order (purchase the NFT).
        `
    },
    {
      role: 'user',
      content
    }
  ]

  console.log(messages, 'messages')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      functions: functions
    })

    console.log(response.choices[0].message, 'response')
    console.log(response.choices[0].message?.function_call?.arguments)

    // 引数をparse

    const aiState = getMutableAIState()

    const textStream = createStreamableValue('')
    const spinnerStream = createStreamableUI(<SpinnerMessage />)
    const messageStream = createStreamableUI(null)
    const uiStream = createStreamableUI()
    if (
      response.choices[0].message?.function_call?.name === 'getRecommendedNFTs'
    ) {
      const { wallet_address, chain_id, limit, genre } = JSON.parse(
        response.choices[0].message?.function_call?.arguments
      )

      // const chain_id = 1
      // const wallet_address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
      // const limit = 3
      // const genre = 'art'

      const nfts = await getRecommendedNFTs(
        wallet_address,
        chain_id,
        limit,
        genre
      )
      console.log(nfts, 'nfts')

      const nftDetailsPromises = nfts?.items.map(
        (nft: { contract_address: string; token_id: string }) =>
          getNFTDetails(nft.contract_address, nft.token_id)
      )

      const nftDetails = await Promise.all(nftDetailsPromises)

      console.log(nftDetails, 'nftDetails')

      aiState.update({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: 'user',
            content: `${aiState.get().interactions.join('\n\n')}\n\n${content}`
          }
        ]
      })

      uiStream.update(
        <BotCard>
          <ListNFTs nfts={nftDetails} args={{ wallet_address, genre }} />
        </BotCard>
      )

      aiState.done({
        ...aiState.get(),
        interactions: [],
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: 'assistant',
            content:
              "Here's a list of NFTs for you. Choose one and we can proceed to pick a seat.",
            display: {
              name: 'showNFTs',
              props: {
                summary: nftDetails
              }
            }
          }
        ]
      })
    } else if (
      response.choices[0].message?.function_call?.name === 'getNFTOrders'
    ) {
      const { contractAddress, tokenId } = JSON.parse(
        response.choices[0].message?.function_call?.arguments
      )
      console.log(contractAddress, tokenId, 'contract_address, token_id')

      const orders = await getNFTOrders(contractAddress, tokenId)
      console.log(orders, 'orders')
      console.log(orders.orders[0].maker)
      console.log(orders.orders[0])

      uiStream.update(
        <BotCard>
          <ListOrders orders={orders.orders} />
        </BotCard>
      )
    }

    return {
      id: nanoid(),
      attachments: uiStream.value,
      spinner: spinnerStream.value,
      display: messageStream.value
    }
  } catch (error) {
    console.error('Error calling OpenAI function:', error)
  }
}

async function purchaseNFT(orderHash: string) {
  'use server'

  await rateLimit()

  console.log(orderHash, 'orderHash kkkkkkk')

  const spinnerStream = createStreamableUI(<SpinnerMessage />)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  uiStream.update(
    <BotCard>
      <PurchaseTickets />
    </BotCard>
  )

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

async function describeImage(imageBase64: string) {
  'use server'

  await rateLimit()

  const aiState = getMutableAIState()
  const spinnerStream = createStreamableUI(null)
  const messageStream = createStreamableUI(null)
  const uiStream = createStreamableUI()

  uiStream.update(
    <BotCard>
      <Video isLoading />
    </BotCard>
  )
  ;(async () => {
    try {
      let text = ''

      // attachment as video for demo purposes,
      // add your implementation here to support
      // video as input for prompts.
      if (imageBase64 === '') {
        await new Promise(resolve => setTimeout(resolve, 5000))

        text = `
      The books in this image are:

      1. The Little Prince by Antoine de Saint-Exupéry
      2. The Prophet by Kahlil Gibran
      3. Man's Search for Meaning by Viktor Frankl
      4. The Alchemist by Paulo Coelho
      5. The Kite Runner by Khaled Hosseini
      6. To Kill a Mockingbird by Harper Lee
      7. The Catcher in the Rye by J.D. Salinger
      8. The Great Gatsby by F. Scott Fitzgerald
      9. 1984 by George Orwell
      10. Animal Farm by George Orwell
      `
      } else {
        const imageData = imageBase64.split(',')[1]

        const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })
        const prompt = 'List the books in this image.'
        const image = {
          inlineData: {
            data: imageData,
            mimeType: 'image/png'
          }
        }

        const result = await model.generateContent([prompt, image])
        text = result.response.text()
        console.log(text)
      }

      spinnerStream.done(null)
      messageStream.done(null)

      uiStream.done(
        <BotCard>
          <Video />
        </BotCard>
      )

      aiState.done({
        ...aiState.get(),
        interactions: [text]
      })
    } catch (e) {
      console.error(e)

      const error = new Error(
        'The AI got rate limited, please try again later.'
      )
      uiStream.error(error)
      spinnerStream.error(error)
      messageStream.error(error)
      aiState.done()
    }
  })()

  return {
    id: nanoid(),
    attachments: uiStream.value,
    spinner: spinnerStream.value,
    display: messageStream.value
  }
}

export async function requestCode() {
  'use server'

  const aiState = getMutableAIState()

  aiState.done({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        role: 'assistant',
        content:
          "A code has been sent to user's phone. They should enter it in the user interface to continue."
      }
    ]
  })

  const ui = createStreamableUI(
    <div className="animate-spin">
      <SpinnerIcon />
    </div>
  )

  ;(async () => {
    await sleep(2000)
    ui.done()
  })()

  return {
    status: 'requires_code',
    display: ui.value
  }
}

export async function validateCode() {
  'use server'

  const aiState = getMutableAIState()

  const status = createStreamableValue('in_progress')
  const ui = createStreamableUI(
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-zinc-500">
      <div className="animate-spin">
        <SpinnerIcon />
      </div>
      <div className="text-sm text-zinc-500">
        Please wait while we fulfill your order.
      </div>
    </div>
  )

  ;(async () => {
    await sleep(2000)

    ui.done(
      <div className="flex flex-col items-center text-center justify-center gap-3 p-4 text-emerald-700">
        <CheckIcon />
        <div>Payment Succeeded</div>
        <div className="text-sm text-zinc-600">
          Thanks for your purchase! You will receive an email confirmation
          shortly.
        </div>
      </div>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          role: 'assistant',
          content: 'The purchase has completed successfully.'
        }
      ]
    })

    status.done('completed')
  })()

  return {
    status: status.value,
    display: ui.value
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id?: string
  name?: string
  display?: {
    name: string
    props: Record<string, any>
  }
}

export type AIState = {
  chatId: string
  interactions?: string[]
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
  spinner?: React.ReactNode
  attachments?: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    requestCode,
    validateCode,
    describeImage,
    purchaseNFT
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), interactions: [], messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'assistant' ? (
          message.display?.name === 'showFlights' ? (
            <BotCard>
              <ListFlights summary={message.display.props.summary} />
            </BotCard>
          ) : message.display?.name === 'showSeatPicker' ? (
            <BotCard>
              <SelectSeats summary={message.display.props.summary} />
            </BotCard>
          ) : message.display?.name === 'showHotels' ? (
            <BotCard>
              <ListHotels />
            </BotCard>
          ) : message.content === 'The purchase has completed successfully.' ? (
            <BotCard>
              <PurchaseTickets status="expired" />
            </BotCard>
          ) : message.display?.name === 'showBoardingPass' ? (
            <BotCard>
              <BoardingPass summary={message.display.props.summary} />
            </BotCard>
          ) : message.display?.name === 'listDestinations' ? (
            <BotCard>
              <Destinations destinations={message.display.props.destinations} />
            </BotCard>
          ) : message.display?.name === 'showNFTs' ? (
            <BotCard>
              <Destinations destinations={message.display.props.destinations} />
            </BotCard>
          ) : (
            <BotMessage content={message.content} />
          )
        ) : message.role === 'user' ? (
          <UserMessage showAvatar>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
