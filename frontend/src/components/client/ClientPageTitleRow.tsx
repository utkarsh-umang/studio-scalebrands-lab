import { ClientCreditsBadge } from './ClientCreditsBadge'

type Props = {
  title: string
  credits: number
  reservedCredits?: number
}

export function ClientPageTitleRow({ title, credits, reservedCredits }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-[family-name:var(--heading)] text-foreground text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h1>
      <ClientCreditsBadge credits={credits} reserved={reservedCredits} />
    </div>
  )
}
