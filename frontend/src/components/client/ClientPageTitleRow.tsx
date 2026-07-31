import { ClientCreditsBadge } from './ClientCreditsBadge'

type Props = {
  title: string
  credits: number
  reservedCredits?: number
  eyebrow?: string
  subtitle?: string
}

export function ClientPageTitleRow({
  title,
  credits,
  reservedCredits,
  eyebrow,
  subtitle,
}: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-5 md:flex-nowrap">
      <div className="min-w-0 max-w-2xl flex-1">
        {eyebrow ? (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-[family-name:var(--heading)] text-foreground text-3xl font-bold tracking-[-0.035em] md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>
      <ClientCreditsBadge credits={credits} reserved={reservedCredits} />
    </div>
  )
}
