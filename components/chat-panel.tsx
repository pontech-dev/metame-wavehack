'use client'

import * as React from 'react'

import { shareChat } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconShare } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import { nanoid } from 'nanoid'
import { UserMessage } from './stocks/message'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useBalance } from 'wagmi'

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ChatPanel({
  id,
  title,
  input,
  setInput,
  isAtBottom,
  scrollToBottom
}: ChatPanelProps) {
  const [aiState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)

  const { open, close } = useWeb3Modal()
  const { address } = useAccount()
  const { data: ethBalance } = useBalance({
    address: address
  })

  const exampleMessages = [
    {
      heading: `会話を始める: `,
      subheading: address,
      message: `ウォレットアドレス: ${address} について分析をしてください. このウォレットの残高は${ethBalance?.formatted.slice(0, 7)} ${ethBalance?.symbol} です`
    }
  ]

  return (
    <div className="fixed inset-x-0 bg-white/90 bottom-0 w-full duration-300 ease-in-out peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px] dark:from-10%">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="mb-4 grid sm:grid-cols-2 gap-2 sm:gap-4 px-4 sm:px-0"></div>
        <div className="mx-auto text-center mb-4">
          {address ? (
            <>
              {' '}
              {messages.length === 0 &&
                exampleMessages.map((example, index) => (
                  <div
                    key={example.heading}
                    className={cn(
                      'cursor-pointer bg-zinc-50 text-zinc-950 rounded-2xl p-4 sm:p-6 hover:bg-zinc-100 transition-colors',
                      index > 1 && 'hidden md:block'
                    )}
                    onClick={async () => {
                      setMessages(currentMessages => [
                        ...currentMessages,
                        {
                          id: nanoid(),
                          display: <UserMessage>{example.message}</UserMessage>
                        }
                      ])

                      // const aiState = getMutableAIState()

                      try {
                        const responseMessage = await submitUserMessage(
                          example.message
                        )

                        if (!responseMessage) {
                          return toast.error(
                            'No response from AI. Please try again with a different wallet'
                          )
                        }

                        console.log(responseMessage)

                        setMessages(currentMessages => [
                          ...currentMessages,
                          responseMessage
                        ])
                      } catch {
                        toast(
                          <div className="text-red-600">
                            You have reached your message limit! Please try
                            again later, or{' '}
                            <a
                              className="underline"
                              target="_blank"
                              rel="noopener noreferrer"
                              href="https://vercel.com/templates/next.js/gemini-ai-chatbot"
                            >
                              deploy your own version
                            </a>
                            .
                          </div>
                        )
                      }
                    }}
                  >
                    <div className="font-medium">{example.heading}</div>
                    <div className="text-sm text-zinc-800">
                      {example.subheading}
                    </div>
                  </div>
                ))}
            </>
          ) : (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => open()}
            >
              Connect Wallet
            </button>
          )}
        </div>

        {messages?.length >= 2 ? (
          <div className="flex h-fit items-center justify-center">
            <div className="flex space-x-2">
              {id && title ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <IconShare className="mr-2" />
                    Share
                  </Button>
                  <ChatShareDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    onCopy={() => setShareDialogOpen(false)}
                    shareChat={shareChat}
                    chat={{
                      id,
                      title,
                      messages: aiState.messages
                    }}
                  />
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:pb-4">
          <PromptForm input={input} setInput={setInput} />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
