import { ExternalLink } from '@/components/external-link'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-zinc-50 sm:p-8 p-4 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block">
          Next.js MetaMe Chatbot
        </h1>
        <p className="leading-normal text-zinc-900">
          MetaMe Recommend
          APIを使用した、Next.jsで構築されたチャットボットです。自然言語でMetaMe
          APIを呼び出し、ウォレットアドレスに対しておすすめのNFTを表示します。
        </p>
        <p className="leading-normal text-zinc-900">
          <ExternalLink href="https://vercel.com/blog/ai-sdk-3-generative-ui">
            OpenSea API
          </ExternalLink>{' '}
          を使用して、NFTの詳細情報を取得し、表示します。 またOpenSea
          APIを利用してNFTのオーダーを取得し、購入することもできます。
        </p>
      </div>
    </div>
  )
}
