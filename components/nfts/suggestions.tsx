'use client'

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { useActions, useUIState } from 'ai/rsc'
import { SparklesIcon } from '@/components/ui/icons'

export const suggestions = ['Game', 'PFP', 'Music']

export const Suggestions = () => {
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState()

  return (
    <div className="grid gap-4">
      <div className="flex flex-col sm:flex-row items-start gap-2">
        {suggestions.map(suggestion => (
          <div
            key={suggestion}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors bg-zinc-50 hover:bg-zinc-100 rounded-xl cursor-pointer"
            onClick={async () => {
              const response = await submitUserMessage(
                `ジャンル:${suggestion}のおすすめのNFTを教えてください`
              )
              setMessages((currentMessages: any[]) => [
                ...currentMessages,
                response
              ])
            }}
          >
            <SparklesIcon />
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  )
}
